import Centrifuge from '@centrifuge/centrifuge-js'
import { combineLatest, map, Observable } from 'rxjs'
import { PoolMetadata } from '../types'
import { useCentrifugeQuery } from './useCentrifugeQuery'
import { useMetadata } from './useMetadata'

export function usePools(suspense = true) {
  const [result] = useCentrifugeQuery(['pools'], (cent) => cent.pools.getPools(), {
    suspense,
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

export function useMonthlyPoolStates(poolId: string) {
  const [result] = useCentrifugeQuery(
    ['monthlyPoolStates', poolId],
    (cent) => cent.pools.getMonthlyPoolStates([poolId]),
    {
      suspense: true,
    }
  )

  return result
}

export function useOrder(poolId: string, trancheId: string, address?: string) {
  const [result] = useCentrifugeQuery(
    ['order', trancheId, address],
    (cent) => cent.pools.getOrder([address!, poolId, trancheId]),
    {
      enabled: !!address,
    }
  )

  return result
}

export function usePendingCollect(poolId: string, trancheId?: string, address?: string) {
  const pool = usePool(poolId)
  const [result] = useCentrifugeQuery(
    ['pendingCollect', poolId, trancheId, address],
    (cent) => cent.pools.getPendingCollect([address!, poolId, trancheId!, pool!.epoch.lastExecuted]),
    {
      enabled: !!address && !!pool && !!trancheId,
    }
  )

  return result
}

export function usePendingCollectMulti(poolId: string, trancheIds?: string[], address?: string) {
  const pool = usePool(poolId)
  const [result] = useCentrifugeQuery(
    ['pendingCollectPool', poolId, trancheIds, address],
    (cent) =>
      combineLatest(
        trancheIds!.map((tid) => cent.pools.getPendingCollect([address!, poolId, tid, pool!.epoch.lastExecuted]))
      ).pipe(
        map((orders) => {
          const obj: Record<
            string,
            ReturnType<Centrifuge['pools']['getPendingCollect']> extends Observable<infer T> ? T : never
          > = {}
          trancheIds!.forEach((tid, i) => {
            obj[tid] = orders[i]
          })
          return obj
        })
      ),
    {
      enabled: !!address && !!pool && !!trancheIds?.length,
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
