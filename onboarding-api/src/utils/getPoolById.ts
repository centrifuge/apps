import { getCentPoolById } from './centrifuge'
import { getTinlakePoolById } from './tinlake'

export const getPoolById = async (poolId: string) => {
  return poolId.startsWith('0x') ? await getCentPoolById(poolId) : await getTinlakePoolById(poolId)
}
