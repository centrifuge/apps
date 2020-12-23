import { Injectable, Logger } from '@nestjs/common'
import { ethers } from 'ethers'
import contractAbiPoolRegistry from '../utils/PoolRegistry.abi'
const fetch = require('@vercel/fetch-retry')(require('node-fetch'))

@Injectable()
export class PoolService {
  private readonly logger = new Logger(PoolService.name)
  private pools: Pool[]

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
    this.pools = pools

    this.logger.log(`Loaded ${Object.keys(this.pools).length} pools from IPFS`)
  }

  private async assembleIpfsUrl(): Promise<string> {
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)
    const registry = new ethers.Contract(process.env.POOL_REGISTRY, contractAbiPoolRegistry, provider)
    const poolData = await registry.pools(0)
    const url = new URL(poolData[3], process.env.IPFS_GATEWAY)
    return url.href
  }
}

export interface Pool {
  metadata: any
  addresses: { [key: string]: string }
  network: 'mainnet' | 'kovan'
}
