import { Injectable, Logger } from '@nestjs/common'
import { ethers } from 'ethers'
import { Tranche } from '../controllers/types'
import config from '../config'
import contractAbiPoolRegistry from '../utils/PoolRegistry.abi'
import contractAbiMemberlist from '../utils/Memberlist.abi'
import contractAbiMemberAdmin from '../utils/MemberAdmin.abi'
import { AddressEntity, AddressRepo } from '../repos/address.repo'
import { InvestmentRepo } from '../repos/investment.repo'
const fetch = require('@vercel/fetch-retry')(require('node-fetch'))

@Injectable()
export class PoolService {
  private readonly logger = new Logger(PoolService.name)
  private pools: { [key: string]: Pool }

  provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
  signer = new ethers.Wallet(config.signerPrivateKey).connect(this.provider)
  registry = new ethers.Contract(config.poolRegistry, contractAbiPoolRegistry, this.provider)

  constructor(private readonly addressRepo: AddressRepo, private readonly investmentRepo: InvestmentRepo) {
    this.loadFromIPFS()
  }

  async get(poolId: string) {
    if (poolId in this.pools) return this.pools[poolId]

    await this.loadFromIPFS()

    if (!(poolId in this.pools)) throw new Error(`Pool ${poolId} not found`)
    return this.pools[poolId]
  }

  getIds() {
    return Object.keys(this.pools)
  }

  private async loadFromIPFS() {
    const url = await this.assembleIpfsUrl()
    const response = await fetch(url)
    const pools = await response.json()

    let poolsWithProfiles = {}
    await Promise.all(
      Object.values(pools).map(async (pool: Pool) => {
        if (!pool.addresses) return

        const profile = await this.getPoolProfile(pool.addresses.ROOT_CONTRACT)
        if (profile) poolsWithProfiles[pool.addresses.ROOT_CONTRACT] = { ...pool, profile }
      })
    )

    this.pools = poolsWithProfiles
    this.logger.log(`Loaded ${Object.keys(this.pools).length} pools with profiles from IPFS`)
  }

  private async assembleIpfsUrl(): Promise<string> {
    const poolData = await this.registry.pools(0)
    const url = new URL(poolData[3], config.ipfsGateway)
    return url.href
  }

  // TODO: this requires two requests per pool. At some point we should refactor the CLI to include
  // these profile hashes directly in the all pools file, to reduce these requests to one per pool.
  private async getPoolProfile(poolId: string): Promise<Profile | undefined> {
    // Get pool metadata
    const poolData = await this.registry.find(poolId)
    const url = new URL(poolData[2], config.ipfsGateway)
    const response = await fetch(url)
    const pool = await response.json()

    if (!pool.profile) return undefined

    // Get pool profile
    const profileUrl = new URL(pool.profile, config.ipfsGateway)
    const profileResponse = await fetch(profileUrl)
    const profile = await profileResponse.json()
    return profile
  }

  async addToMemberlist(userId: string, poolId: string, tranche: Tranche): Promise<any> {
    const pool = await this.get(poolId)
    if (!pool) throw new Error(`Failed to get pool ${poolId} when adding to memberlist`)

    const memberAdmin = new ethers.Contract(config.memberAdminContractAddress, contractAbiMemberAdmin, this.signer)
    const memberlistAddress = tranche === 'senior' ? pool.addresses.SENIOR_MEMBERLIST : pool.addresses.JUNIOR_MEMBERLIST

    const validUntilDate = new Date()
    validUntilDate.setFullYear(validUntilDate.getFullYear() + 100) // 100 years
    const validUntil = Math.round(validUntilDate.getTime() / 1000)

    const addresses = await this.addressRepo.getByUser(userId)
    addresses.forEach(async (address: AddressEntity) => {
      try {
        const tx = await memberAdmin.updateMember(memberlistAddress, address.address, validUntil)
        this.logger.log(`Submitted tx to add ${address.address} to ${memberlistAddress}: ${tx.hash}`)
        await this.provider.waitForTransaction(tx.hash)

        this.checkMemberlist(memberlistAddress, address, pool, tranche)
      } catch (e) {
        console.error(`Failed to add ${address.address} to ${memberlistAddress}: ${e}`)
      }
    })
  }

  async checkMemberlist(memberlistAddrss: string, address: AddressEntity, pool: Pool, tranche: Tranche): Promise<any> {
    const memberlist = new ethers.Contract(memberlistAddrss, contractAbiMemberlist, this.provider)

    const isWhitelisted = await memberlist.hasMember(address.address)

    if (isWhitelisted) {
      this.logger.log(`${address.address} is a member of ${pool.metadata.name} - ${tranche}`)
      this.investmentRepo.upsert(address.id, pool.addresses.ROOT_CONTRACT, tranche, true)
    } else {
      this.logger.log(`${address.address} is not a member of ${pool.metadata.name} - ${tranche}`)
    }
  }
}

export interface Pool {
  metadata: any
  addresses: { [key: string]: string }
  network: 'mainnet' | 'kovan'
  profile?: Profile
}

export interface ProfileAgreement {
  name: string
  provider: 'docusign'
  providerTemplateId: string
  tranche: 'senior' | 'junior'
  country: 'us' | 'non-us'
}

export interface Profile {
  agreements: ProfileAgreement[] // TODO: add typing
  issuer: {
    name: string
    email: string
  }
}
