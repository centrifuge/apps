import Centrifuge, { BorrowerTransaction, Loan, Pool, PoolMetadata } from '@centrifuge/centrifuge-js'
import { useCentrifugeConsts, useCentrifugeQuery, useWallet } from '@centrifuge/centrifuge-react'
import BN from 'bn.js'
import { useEffect, useMemo } from 'react'
import { useQueries, useQuery } from 'react-query'
import { combineLatest, map, Observable } from 'rxjs'
import { Dec } from './Decimal'
import { TinlakePool, useTinlakePools } from './tinlake/useTinlakePools'
import { useLoan, useLoans } from './useLoans'
import { useMetadata, useMetadataMulti } from './useMetadata'

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

export function useTransactionsByAddress(address?: string) {
  const [result] = useCentrifugeQuery(
    ['txByAddress', address],
    (cent) => cent.pools.getTransactionsByAddress([address!]),
    {
      enabled: !!address,
    }
  )

  return result
}

export function useInvestorTransactions(poolId: string, trancheId?: string, from?: Date, to?: Date) {
  const [result] = useCentrifugeQuery(['investorTransactions', poolId, trancheId, from, to], (cent) =>
    cent.pools.getInvestorTransactions([poolId, trancheId, from, to])
  )

  return result
}

export function useBorrowerTransactions(poolId: string, from?: Date, to?: Date) {
  const [result] = useCentrifugeQuery(
    ['borrowerTransactions', poolId, from, to],
    (cent) => cent.pools.getBorrowerTransactions([poolId, from, to]),
    {
      enabled: !poolId.startsWith('0x'),
    }
  )

  return result
}

export function useAverageAmount(poolId: string) {
  const pool = usePool(poolId)
  const loans = useLoans(poolId)

  if (!loans?.length || !pool) return new BN(0)

  return (loans as Loan[])
    .reduce((sum, loan) => {
      if (loan.status !== 'Active') return sum
      return sum.add(loan.presentValue.toDecimal())
    }, Dec(0))
    .div((loans as Loan[]).filter((loan) => loan.status === 'Active').length)
}

export function useBorrowerAssetTransactions(poolId: string, assetId: string, from?: Date, to?: Date) {
  const pool = usePool(poolId)
  const loan = useLoan(poolId, assetId)

  const [result] = useCentrifugeQuery(
    ['borrowerAssetTransactions', poolId, assetId, from, to],
    (cent) => {
      const borrowerTransactions = cent.pools.getBorrowerTransactions([poolId, from, to])

      return borrowerTransactions.pipe(
        map((transactions: BorrowerTransaction[]) =>
          transactions.filter((transaction) => transaction.loanId.split('-')[1] === assetId)
        )
      )
    },
    {
      enabled: !!pool && !poolId.startsWith('0x') && !!loan,
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
export function usePoolMetadataMulti(pools?: (Pool | TinlakePool)[]) {
  const poolsIndexed = pools?.map((p, i) => [i, p, 'isTinlakePool' in p] as const) ?? []
  const indices: Record<number, number> = {}
  const centPools = poolsIndexed?.filter(([, , isTinlake]) => !isTinlake)
  const tinlakePools = poolsIndexed?.filter(([, , isTinlake]) => isTinlake)
  centPools.forEach(([pi], qi) => {
    indices[pi] = qi
  })
  tinlakePools.forEach(([pi], qi) => {
    indices[pi] = qi
  })

  const centData = useMetadataMulti<PoolMetadata>(centPools?.map(([, p]) => p.metadata as string) ?? [])
  const tinlakeData = useQueries(
    tinlakePools?.map(([, p]) => {
      return {
        queryKey: ['tinlakeMetadata', p.id],
        queryFn: () => p.metadata as PoolMetadata,
        enabled: !!p.metadata,
        staleTime: Infinity,
      }
    })
  )
  return poolsIndexed.map(([poolIndex, , isTinlake]) => {
    const queryIndex = indices[poolIndex]
    return isTinlake ? tinlakeData[queryIndex] : centData[queryIndex]
  })
}

export function useWriteOffGroups(poolId: string) {
  const [result] = useCentrifugeQuery(['writeOffGroups', poolId], (cent) => cent.pools.getWriteOffPolicy([poolId]))

  return result
}

const POOL_CHANGE_DELAY = 1000 * 60 * 60 * 24 * 7 // Currently hard-coded to 1 week on chain, will probably change to a constant we can query

export function useLoanChanges(poolId: string) {
  const poolOrders = usePoolOrders(poolId)

  const [result] = useCentrifugeQuery(['loanChanges', poolId], (cent) => cent.pools.getProposedLoanChanges([poolId]))

  const policyChanges = useMemo(() => {
    const hasLockedRedemptions = (poolOrders?.reduce((acc, cur) => acc + cur.activeRedeem.toFloat(), 0) ?? 0) > 0

    return result
      ?.filter(({ change }) => !!change.loan?.policy?.length)
      .map((policy) => {
        const waitingPeriodDone = new Date(policy.submittedAt).getTime() + POOL_CHANGE_DELAY < Date.now()
        return {
          ...policy,
          status: !waitingPeriodDone
            ? ('waiting' as const)
            : hasLockedRedemptions
            ? ('blocked' as const)
            : ('ready' as const),
        }
      })
  }, [poolOrders, result])

  return { policyChanges }
}

export function usePoolChanges(poolId: string) {
  const pool = usePool(poolId)
  const poolOrders = usePoolOrders(poolId)
  const consts = useCentrifugeConsts()
  const [result] = useCentrifugeQuery(['poolChanges', poolId], (cent) => cent.pools.getProposedPoolChanges([poolId]))

  return useMemo(
    () => {
      if (!result) return result
      const submittedTime = new Date(result.submittedAt).getTime()
      const waitingPeriodDone = submittedTime + consts.poolSystem.minUpdateDelay * 1000 < Date.now()
      const hasLockedRedemptions = (poolOrders?.reduce((acc, cur) => acc + cur.activeRedeem.toFloat(), 0) ?? 0) > 0
      const isEpochOngoing = pool.epoch.status === 'ongoing'
      const epochNeedsClosing = submittedTime > new Date(pool.epoch.lastClosed).getTime()
      return {
        ...result,
        status: !waitingPeriodDone
          ? ('waiting' as const)
          : hasLockedRedemptions || !isEpochOngoing || epochNeedsClosing
          ? ('blocked' as const)
          : ('ready' as const),
        blockedBy: epochNeedsClosing
          ? ('epochNeedsClosing' as const)
          : hasLockedRedemptions
          ? ('redemptions' as const)
          : !isEpochOngoing
          ? ('epochIsClosing' as const)
          : null,
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [result, poolOrders, pool]
  )
}

export function usePodUrl(poolId: string) {
  const pool = usePool(poolId)
  const { data: poolMetadata } = usePoolMetadata(pool)
  const podUrl = poolMetadata?.pod?.node
  return podUrl
}
