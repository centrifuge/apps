import { firstValueFrom } from 'rxjs'
import { centrifuge } from './centrifuge'

export const getPoolById = async (poolId: string) => {
  const pools = await firstValueFrom(centrifuge.pools.getPools())
  const pool = pools.find((p) => p.id === poolId)
  const metadata = await firstValueFrom(centrifuge.metadata.getMetadata(pool?.metadata!))
  return { pool, metadata }
}
