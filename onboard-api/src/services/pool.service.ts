import { Injectable, Logger } from '@nestjs/common'
import { ethers } from 'ethers'
import config from '../config'
import contractAbiPoolRegistry from '../utils/PoolRegistry.abi'
const fetch = require('@vercel/fetch-retry')(require('node-fetch'))

@Injectable()
export class PoolService {
  private readonly logger = new Logger(PoolService.name)
  private pools: Pool[]

  provider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
  registry = new ethers.Contract(config.poolRegistry, contractAbiPoolRegistry, this.provider)

  constructor() {
    this.loadFromIPFS()
  }

  async get(poolId: string) {
    if (poolId in this.pools) return this.pools[poolId]

    await this.loadFromIPFS()

    if (!(poolId in this.pools)) throw new Error(`Pool ${poolId} not found`)
    return this.pools[poolId]
  }

  private async loadFromIPFS() {
    const url = await this.assembleIpfsUrl()
    const response = await fetch(url)

    const pools = await response.json()

    const poolsWithProfiles = await Promise.all(
      Object.values(pools).map(async (pool: Pool) => {
        if (pool.addresses) {
          const profile = await this.getPoolProfile(pool.addresses.ROOT_CONTRACT)
          if (profile) return { ...pool, profile }
          return pool
        }
        return pool
      })
    )

    this.pools = poolsWithProfiles.filter((pool: Pool) => !!pool.profile)
    this.logger.log(`Loaded ${Object.keys(this.pools).length} pools with profiles from IPFS`)
  }

  private async assembleIpfsUrl(): Promise<string> {
    const poolData = await this.registry.pools(0)
    const url = new URL(poolData[3], config.ipfsGateway)
    return url.href
  }

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

  // TODO: addToMemberlist()
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
