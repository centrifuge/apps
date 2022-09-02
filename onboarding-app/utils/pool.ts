import { PoolStatus } from '../config'
import { PoolData } from './usePools'

export const getPoolStatus = (pool: PoolData): PoolStatus => {
  if (pool.isArchived) return 'Closed'
  if (pool.isUpcoming) return 'Upcoming'
  if ((pool.totalDebt.eqn(0) && pool.totalRepaysAggregatedAmount.eqn(0)) || pool.totalDebt.gtn(0)) {
    return 'Active'
  }
  if (pool.totalDebt.gtn(0)) return 'Deployed'
  if (pool.totalDebt.eqn(0) && pool.totalRepaysAggregatedAmount.gtn(0)) return 'Closed'
  return 'Active'
}
