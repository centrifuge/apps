import { Injectable, Logger } from '@nestjs/common'
const fetch = require('@vercel/fetch-retry')(require('node-fetch'))

@Injectable()
export class PoolService {
  private readonly logger = new Logger(PoolService.name)
  private pools: any[]

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
    // TODO: use ethers to get all pools file from on chain registry
    const response = await fetch(`${process.env.IPFS_GATEWAY}${process.env.POOLS_IPFS_HASH}`)

    const pools = await response.json()
    this.pools = pools

    this.logger.log(
      `Loaded ${Object.keys(this.pools).length} pools from IPFS: ${Object.values(this.pools)
        .map((pool: any) => pool.metadata?.shortName || pool.metadata?.name)
        .join(', ')}`
    )
  }
}
