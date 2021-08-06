import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { ethers } from 'ethers'
import config from '../config'
import { Tranche } from '../controllers/types'
import { AddressEntity, AddressRepo } from '../repos/address.repo'
import { AgreementRepo } from '../repos/agreement.repo'
import { InvestmentRepo } from '../repos/investment.repo'
import { User, UserRepo } from '../repos/user.repo'
import contractAbiMemberAdmin from '../utils/MemberAdmin.abi'
import contractAbiMemberlist from '../utils/Memberlist.abi'
import contractAbiPoolRegistry from '../utils/PoolRegistry.abi'
import { TransactionManager } from '../utils/tx-manager'
const fetch = require('@vercel/fetch-retry')(require('node-fetch'))

@Injectable()
export class PoolService {
  private readonly logger = new Logger(PoolService.name)
  private pools: { [key: string]: Pool } = {}

  provider = new FastJsonRpcProvider(config.rpcUrl)
  signer = new TransactionManager(new ethers.Wallet(config.signerPrivateKey), {
    initialSpeed: 'fast',
    increasedSpeed: 'rapid',
  }).connect(this.provider)
  registry = new ethers.Contract(config.poolRegistry, contractAbiPoolRegistry, this.provider)

  constructor(
    private readonly addressRepo: AddressRepo,
    private readonly investmentRepo: InvestmentRepo,
    private readonly userRepo: UserRepo,
    private readonly agreementRepo: AgreementRepo
  ) {
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
    const prevPools = Object.values(this.pools)

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
    const newPools = prevPools.length - Object.keys(poolsWithProfiles).length

    if (newPools > 0) this.logger.log(`Loaded ${Object.keys(this.pools).length} pools with profiles from IPFS`)
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sync() {
    await this.loadFromIPFS()
  }

  private async assembleIpfsUrl(): Promise<string> {
    const poolData = await this.registry.pools(0)
    const url = new URL(poolData[3], config.ipfsGateway)
    return url.href
  }

  private async getPoolProfile(poolId: string): Promise<Profile | undefined> {
    // Get pool profile
    const profileUrl = `https://raw.githubusercontent.com/centrifuge/tinlake-pools-mainnet/main/profiles/${poolId}.json`
    const profileResponse = await fetch(profileUrl)
    if (!profileResponse.ok) return undefined
    const profile = await profileResponse.json()
    return profile
  }

  // TODO: move to memberlist.service
  async addToMemberlist(userId: string, poolId: string, tranche: Tranche, agreementId: string): Promise<any> {
    const pool = await this.get(poolId)
    if (!pool) throw new Error(`Failed to get pool ${poolId} when adding to memberlist`)

    // A lot of the checks below are redundant, and should have already been checked, but it can't hurt
    // to check again since these constraints cannot be broken in any case.
    const user = await this.userRepo.find(userId)
    if (!user) {
      throw new Error(`Failed to find user for id ${userId}`)
    }

    const agreement = await this.agreementRepo.find(agreementId)
    if (!agreement || !agreement.signedAt || !agreement.counterSignedAt || agreement.userId !== userId) {
      throw new Error(`Failed to find valid & signed agreement for id ${agreementId} & user ${userId}`)
    }

    if (user.entityName?.length === 0 && user.fullName?.length === 0) {
      throw new Error(`Name for user ${userId} is empty, cannot whitelist without this`)
    }

    this.logger.log(`Adding user ${userId} to pool ${poolId}`)
    const memberAdmin = new ethers.Contract(config.memberAdminContractAddress, contractAbiMemberAdmin, this.signer)
    const memberlistAddress = tranche === 'senior' ? pool.addresses.SENIOR_MEMBERLIST : pool.addresses.JUNIOR_MEMBERLIST

    const validUntilDate = new Date()
    validUntilDate.setFullYear(validUntilDate.getFullYear() + 100) // 100 years
    const validUntil = Math.round(validUntilDate.getTime() / 1000)

    // TODO: this should also filter by blockchain and network
    const addresses = await this.addressRepo.getByUser(userId)
    const ethAddresses = addresses.map((a) => a.address)

    try {
      this.logger.log(`Submitting tx to add ${ethAddresses.join(',')} to ${memberlistAddress}`)
      const tx = await memberAdmin.updateMembers(memberlistAddress, ethAddresses, validUntil, { gasLimit: 1000000 })

      this.logger.log(
        `Submitted tx to add ${ethAddresses.join(',')} to ${memberlistAddress}: ${tx.hash} (nonce=${tx.nonce})`
      )
      await this.provider.waitForTransaction(tx.hash)
      this.logger.log(`${tx.hash} (nonce=${tx.nonce}) completed`)

      for (let address of addresses) {
        await this.checkMemberlist(memberlistAddress, address, user, pool, tranche, agreementId)
      }
    } catch (e) {
      console.error(`Failed to add ${ethAddresses.join(',')} to ${memberlistAddress}: ${e}`)
    }
  }

  // TODO: move to memberlist.service
  async checkMemberlist(
    memberlistAddress: string,
    address: AddressEntity,
    user: User,
    pool: Pool,
    tranche: Tranche,
    agreementId: string
  ): Promise<any> {
    try {
      const memberlist = new ethers.Contract(memberlistAddress, contractAbiMemberlist, this.provider)

      this.logger.log(`Checking memberlist for ${address.address}`)
      const isWhitelisted = await memberlist.hasMember(address.address)
      this.logger.log(`Checking memberlist for ${address.address} => ${isWhitelisted ? 'true' : 'false'}`)

      if (isWhitelisted) {
        this.logger.log(`${address.address} is a member of ${pool.metadata.name} - ${tranche}`)
        this.investmentRepo.upsert(
          address.id,
          pool.addresses.ROOT_CONTRACT,
          tranche,
          true,
          agreementId,
          user.entityName?.length > 0 ? user.entityName : user.fullName
        )
      } else {
        this.logger.log(`${address.address} is not a member of ${pool.metadata.name} - ${tranche}`)
      }
    } catch (e) {
      console.error(`Failed to check ${address.address} for ${memberlistAddress}: ${e}`)
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
  agreements: ProfileAgreement[]
  issuer: {
    name: string
    email: string
    restrictedCountryCodes?: string[]
    minInvestmentCurrency?: string
    nonSolicitationNotice?: 'none' | 'non-us' | 'all'
  }
}

class FastJsonRpcProvider extends ethers.providers.JsonRpcProvider {
  async getGasPrice() {
    const gasPrice = await super.getGasPrice()
    return gasPrice.add(gasPrice.div(4)) // add 25% to the gas price to speed it up
  }
}
