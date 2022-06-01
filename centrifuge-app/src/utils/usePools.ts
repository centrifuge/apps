import { PoolMetadata } from '../types'
import { useCentrifugeQuery } from './useCentrifugeQuery'
import { useMetadata } from './useMetadata'

export function usePools() {
  const [result] = useCentrifugeQuery(['pools'], (cent) => cent.pools.getPools(), {
    suspense: true,
  })

  return result
}

export function usePool(id: string) {
  const pools = usePools()
  return pools?.find((p) => p.id === id)
}

export function useTokens() {
  const pools = usePools()
  return pools?.flatMap((p) => p.tranches)
}

export function useDailyPoolStates(poolId: string) {
  const [result] = useCentrifugeQuery(['dailyPoolStates', poolId], (cent) => cent.pools.getDailyPoolStates([poolId]), {
    suspense: true,
  })

  return result
}

export function useOrder(trancheId: string, address?: string) {
  const [result] = useCentrifugeQuery(
    ['order', trancheId, address],
    (cent) => cent.pools.getOrder([address!, trancheId]),
    {
      enabled: !!address,
    }
  )

  return result
}

export function usePendingCollect(poolId: string, trancheId: string, address?: string) {
  const pool = usePool(poolId)
  const [result] = useCentrifugeQuery(
    ['pendingCollect', poolId, trancheId, address],
    (cent) => cent.pools.getPendingCollect([address!, poolId, trancheId, pool!.epoch.lastExecuted]),
    {
      enabled: !!address && !!pool,
    }
  )

  return result
}

export function usePoolPermissions(poolId?: string) {
  const [result] = useCentrifugeQuery(['poolPermissions', poolId], (cent) => cent.pools.getPoolPermissions([poolId!]), {
    enabled: !!poolId,
  })

  return result
}

export function usePoolMetadata(pool?: { metadata?: string }) {
  return useMetadata<PoolMetadata>(pool?.metadata)
}
