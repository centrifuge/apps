import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { ethers } from 'ethers'
import config from '../config'
import { Tranche } from '../controllers/types'
import { AddressEntity, AddressRepo } from '../repos/address.repo'
import { InvestmentRepo } from '../repos/investment.repo'
import { User, UserRepo } from '../repos/user.repo'
import contractAbiMemberAdmin from '../utils/MemberAdmin.abi'
import contractAbiMemberlist from '../utils/Memberlist.abi'
import contractAbiPoolRegistry from '../utils/PoolRegistry.abi'
import contractAbiRwaMarketPermissionManager from '../utils/RwaMarketPermissionManager.abi'
import { TransactionManager } from '../utils/tx-manager'
import MailerService from './mailer.service'

const fetch = require('@vercel/fetch-retry')(require('node-fetch'))

const RwaMarketKey = 'rwa-market'

export const CustomPoolIds = [RwaMarketKey]

export const customPools: { [key: string]: string[] } = { mainnet: [RwaMarketKey], kovan: [] }

@Injectable()
export class PoolService {
  private readonly logger = new Logger(PoolService.name)
  private pools: { [key: string]: Pool } = {}

  provider = new FastJsonRpcProvider(config.rpcUrl)
  signer = new TransactionManager(new ethers.Wallet(config.signerPrivateKey), {
    maxFeePerGas: 600,
    initialPriorityFeePerGas: 4,
  }).connect(this.provider)
  registry = new ethers.Contract(config.poolRegistry, contractAbiPoolRegistry, this.provider)

  rwaMarketPermissionManager = config.rwaMarket.permissionManagerContractAddress
    ? new ethers.Contract(
        config.rwaMarket.permissionManagerContractAddress,
        contractAbiRwaMarketPermissionManager,
        this.signer
      )
    : undefined
  mailer = new MailerService()

  constructor(
    private readonly addressRepo: AddressRepo,
    private readonly investmentRepo: InvestmentRepo,
    private readonly userRepo: UserRepo
  ) {
    this.loadFromIPFS()
  }

  async get(poolId: string) {
    if (poolId in this.pools) return this.pools[poolId]

    await this.loadFromIPFS()

    if (!(poolId in this.pools)) {
      throw new Error(`Pool ${poolId} not found`)
    }
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

    const network = this.provider.network.name === 'homestead' ? 'mainnet' : this.provider.network.name

    this.logger.log(`Network: ${network}`)
    this.logger.log(`Custom pools: ${customPools[network].join(', ')}`)

    customPools[network].forEach(async (poolId: string) => {
      const profile = await this.getPoolProfile(poolId)
      if (profile) {
        poolsWithProfiles[poolId] = { profile, metadata: {}, addresses: {}, network: network }
      }
    })

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
    const network = this.provider.network.name === 'homestead' ? 'mainnet' : this.provider.network.name
    const profileUrl = `https://raw.githubusercontent.com/centrifuge/tinlake-pools-${network}/main/profiles/${poolId}.json`
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

    if (agreementId.length === 0) {
      throw new Error(`Invalid agreement ${agreementId}`)
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
      this.logger.log(
        `Submitting tx to add ${ethAddresses.join(',')} to ${
          poolId === RwaMarketKey ? RwaMarketKey : memberlistAddress
        }`
      )
      const tx =
        poolId === RwaMarketKey
          ? await this.rwaMarketPermissionManager.addPermissions(
              Array(ethAddresses.length).fill(RWA_MARKET_DEPOSITOR_ROLE),
              ethAddresses,
              { gasLimit: 1000000 }
            )
          : await memberAdmin.updateMembers(memberlistAddress, ethAddresses, validUntil, { gasLimit: 1000000 })

      this.logger.log(
        `Submitted tx to add ${ethAddresses.join(',')} to ${
          poolId === RwaMarketKey ? RwaMarketKey : memberlistAddress
        }: ${tx.hash} (nonce=${tx.nonce})`
      )
      await this.provider.waitForTransaction(tx.hash)
      this.logger.log(`${tx.hash} (nonce=${tx.nonce}) completed`)

      for (let address of addresses) {
        await this.checkMemberlist(memberlistAddress, address, user, poolId, tranche, agreementId)
      }
    } catch (e) {
      console.error(
        `Failed to add ${ethAddresses.join(',')} to ${poolId === RwaMarketKey ? RwaMarketKey : memberlistAddress}: ${e}`
      )
    }
  }

  // TODO: move to memberlist.service
  async checkMemberlist(
    memberlistAddress: string | undefined,
    address: AddressEntity,
    user: User,
    poolId: string,
    tranche: Tranche,
    agreementId: string
  ): Promise<any> {
    try {
      const pool = await this.get(poolId)
      if (!pool) throw new Error(`Failed to get pool ${poolId} when adding to memberlist`)

      this.logger.log(`Checking memberlist for ${address.address}`)
      const isWhitelisted =
        poolId === RwaMarketKey
          ? await this.rwaMarketPermissionManager.isInRole(address.address, RWA_MARKET_DEPOSITOR_ROLE)
          : await new ethers.Contract(memberlistAddress, contractAbiMemberlist, this.provider).hasMember(
              address.address
            )
      this.logger.log(`Checking memberlist for ${address.address} => ${isWhitelisted ? 'true' : 'false'}`)

      if (isWhitelisted) {
        this.logger.log(`${address.address} is a member of ${pool.metadata.name} - ${tranche}`)
        this.investmentRepo.upsert(
          address.id,
          poolId === RwaMarketKey ? poolId : pool.addresses.ROOT_CONTRACT,
          tranche,
          true,
          agreementId,
          user.entityName?.length > 0 ? user.entityName : user.fullName
        )
        await this.mailer.sendWhitelistedEmail(user, pool, { tranche })
      } else {
        this.logger.log(`${address.address} is not a member of ${pool.metadata.name} - ${tranche}`)
      }
    } catch (e) {
      console.error(`Failed to check ${address.address} for ${memberlistAddress}: ${e}`)
    }
  }
}

const RWA_MARKET_DEPOSITOR_ROLE = 0

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
  country?: 'us' | 'non-us'
  target?: 'individual' | 'entity'
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
