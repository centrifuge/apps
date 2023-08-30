import Centrifuge, { Pool, PoolMetadata } from '@centrifuge/centrifuge-js'
import { useCentrifuge, useCentrifugeQuery, useWallet } from '@centrifuge/centrifuge-react'
import { useEffect } from 'react'
import { useQuery } from 'react-query'
import { combineLatest, map, Observable } from 'rxjs'
import { TinlakePool, useTinlakePools } from './tinlake/useTinlakePools'
import { useMetadata } from './useMetadata'

export function usePools(suspense = true) {
  const [result] = useCentrifugeQuery(['pools'], (cent) => cent.pools.getPools(), {
    suspense,
  })

  return result
}

export function usePool<T extends boolean = true>(
  id: string,
  required?: T
): T extends true ? Pool | TinlakePool : Pool | TinlakePool | undefined {
  const isTinlakePool = id.startsWith('0x')
  const tinlakePools = useTinlakePools(isTinlakePool)
  const pools = usePools()
  const pool = isTinlakePool
    ? tinlakePools?.data?.pools?.find((p) => p.id.toLowerCase() === id.toLowerCase())
    : pools?.find((p) => p.id === id)

  if (!pool && required !== false) {
    throw new Error('Pool not found')
  }

  return pool as T extends true ? Pool | TinlakePool : Pool | TinlakePool | undefined
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

export function useDailyTVL() {
  const [result] = useCentrifugeQuery(['daily TVL'], (cent) => cent.pools.getDailyTVL(), {
    suspense: true,
  })

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

const addedMultisigs = new WeakSet()

export function usePoolMetadata(
  pool?: { metadata?: string } | { id: string; metadata?: string | Partial<PoolMetadata> }
) {
  const { substrate } = useWallet()
  const data = useMetadata<PoolMetadata>(typeof pool?.metadata === 'string' ? pool.metadata : undefined)
  const tinlakeData = useQuery(
    ['tinlakeMetadata', pool && 'id' in pool && pool.id],
    () => pool?.metadata as PoolMetadata
  )
  useEffect(() => {
    if (data.data?.adminMultisig && !addedMultisigs.has(data.data?.adminMultisig)) {
      substrate.addMultisig(data.data.adminMultisig)
      addedMultisigs.add(data.data.adminMultisig)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.data])
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
        maxWriteOffPolicySize: Number(api.consts.loans.maxWriteOffPolicySize.toHuman()),
      }
    },
    {
      staleTime: Infinity,
    }
  )

  return data
}

export function useWriteOffGroups(poolId: string) {
  const [result] = useCentrifugeQuery(['writeOffGroups', poolId], (cent) => cent.pools.getWriteOffPolicy([poolId]))

  return result
}

export function useLoanChanges(poolId: string) {
  const [result] = useCentrifugeQuery(['loanChanges', poolId], (cent) => cent.pools.getProposedLoanChanges([poolId]))

  return result
}

export function usePoolChanges(poolId: string) {
  const [result] = useCentrifugeQuery(['poolChanges', poolId], (cent) => cent.pools.getProposedPoolChanges([poolId]))

  return result
}

export function usePodUrl(poolId: string) {
  const pool = usePool(poolId)
  const { data: poolMetadata } = usePoolMetadata(pool)
  const podUrl = poolMetadata?.pod?.node
  return podUrl
}
