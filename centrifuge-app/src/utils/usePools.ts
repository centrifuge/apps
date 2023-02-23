import Centrifuge, { PoolMetadata } from '@centrifuge/centrifuge-js'
import { useCentrifuge, useCentrifugeQuery } from '@centrifuge/centrifuge-react'
import { useQuery } from 'react-query'
import { combineLatest, map, Observable } from 'rxjs'
import { useTinlakePools } from './tinlake/useTinlakePools'
import { useMetadata } from './useMetadata'

export function usePools(suspense = true) {
  const [result] = useCentrifugeQuery(['pools'], (cent) => cent.pools.getPools(), {
    suspense,
  })

  return result
}

export function usePool(id: string) {
  const isTinlakePool = id.startsWith('0x')
  const tinlakePools = useTinlakePools(isTinlakePool)
  const pools = usePools()
  const pool = isTinlakePool
    ? tinlakePools?.data?.pools?.find((p) => p.id.toLowerCase() === id.toLowerCase())
    : pools?.find((p) => p.id === id)
  if (!pool) throw new Error(`Pool not found`)
  return pool
}

export function useTokens() {
  const pools = usePools()
  return pools?.flatMap((p) => p.tranches)
}

export function useMonthlyPoolStates(poolId: string, from?: Date, to?: Date) {
  const [result] = useCentrifugeQuery(
    ['monthlyPoolStates', poolId, from, to],
    (cent) => cent.pools.getMonthlyPoolStates([poolId, from, to]),
    {
      suspense: true,
    }
  )

  return result
}

export function useInvestorTransactions(poolId: string, trancheId?: string, from?: Date, to?: Date) {
  const [result] = useCentrifugeQuery(
    ['investorTransactions', poolId, trancheId, from, to],
    (cent) => cent.pools.getInvestorTransactions([poolId, trancheId, from, to]),
    {
      suspense: true,
    }
  )

  return result
}

export function useBorrowerTransactions(poolId: string, from?: Date, to?: Date) {
  const [result] = useCentrifugeQuery(
    ['borrowerTransactions', poolId, from, to],
    (cent) => cent.pools.getBorrowerTransactions([poolId, from, to]),
    {
      suspense: true,
    }
  )

  return result
}

export function useDailyPoolStates(poolId: string, from?: Date, to?: Date) {
  if (poolId.startsWith('0x')) throw new Error('Only works with Centrifuge Pools')
  const [result] = useCentrifugeQuery(
    ['dailyPoolStates', poolId, from, to],
    (cent) => cent.pools.getDailyPoolStates([poolId, from, to]),
    {
      suspense: true,
    }
  )

  return result
}

export function useDailyTrancheStates(trancheId: string) {
  const [result] = useCentrifugeQuery(
    ['dailyTrancheStates', { trancheId }],
    (cent) => cent.pools.getDailyTrancheStates([trancheId]),
    {
      suspense: true,
    }
  )

  return result
}

export function usePoolOrders(poolId: string) {
  const [result] = useCentrifugeQuery(['poolOrders', poolId], (cent) => cent.pools.getPoolOrders([poolId]))

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
    (cent) => cent.pools.getPendingCollect([address!, poolId, trancheId!, pool.epoch.lastExecuted]),
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
        trancheIds!.map((tid) => cent.pools.getPendingCollect([address!, poolId, tid, pool.epoch.lastExecuted]))
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

export function usePoolMetadata(
  pool?: { metadata?: string } | { id: string; metadata?: string | Partial<PoolMetadata> }
) {
  const data = useMetadata<PoolMetadata>(typeof pool?.metadata === 'string' ? pool.metadata : undefined)
  const tinlakeData = useQuery(
    ['tinlakeMetadata', pool && 'id' in pool && pool.id],
    () => pool?.metadata as PoolMetadata
  )
  return typeof pool?.metadata === 'string' ? data : tinlakeData
}

export function useConstants() {
  const centrifuge = useCentrifuge()
  const { data } = useQuery(
    ['constants'],
    async () => {
      const api = await centrifuge.getApiPromise()
      return {
        minUpdateDelay: Number(api.consts.poolSystem.minUpdateDelay.toHuman()),
        maxTranches: Number(api.consts.poolSystem.maxTranches.toHuman()),
        challengeTime: Number(api.consts.poolSystem.challengeTime.toHuman()),
        maxWriteOffGroups: Number(api.consts.loans.maxWriteOffGroups.toHuman()),
      }
    },
    {
      staleTime: Infinity,
    }
  )

  return data
}

export function useWriteOffGroups(poolId: string) {
  const [result] = useCentrifugeQuery(['writeOffGroups', poolId], (cent) => cent.pools.getWriteOffGroups([poolId]))

  return result
}
