import { combineLatest } from 'rxjs'
import { map } from 'rxjs/operators'
import { useCentrifugeQuery } from './useCentrifugeQuery'

export function useLoans(poolId: string) {
  const [result] = useCentrifugeQuery(['loans', poolId], (cent) => cent.pools.getLoans([poolId]), {
    suspense: true,
  })

  return result
}

export function useLoansAcrossPools(poolIds?: string[]) {
  const [result] = useCentrifugeQuery(
    ['loansAcrossPools', poolIds],
    (cent) => combineLatest(poolIds!.map((poolId) => cent.pools.getLoans([poolId]))).pipe(map((loans) => loans.flat())),
    {
      suspense: true,
      enabled: poolIds && poolIds.length > 0,
    }
  )

  return result
}

export function useLoan(poolId: string, assetId: string) {
  const [result] = useCentrifugeQuery(['loan', poolId, assetId], (cent) => cent.pools.getLoan([poolId, assetId]), {
    suspense: true,
  })

  return result
}
