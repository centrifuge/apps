import { Logger, Injectable } from '@nestjs/common'
import fetch from 'node-fetch'

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
