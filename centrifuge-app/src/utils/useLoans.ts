import { Loan, TinlakeLoan } from '@centrifuge/centrifuge-js'
import { useCentrifugeQuery } from '@centrifuge/centrifuge-react'
import { combineLatest } from 'rxjs'
import { map } from 'rxjs/operators'
import { Dec } from './Decimal'
import { useTinlakeLoans } from './tinlake/useTinlakePools'

export function useLoans(poolId: string) {
  const isTinlakePool = poolId.startsWith('0x')
  const [centLoans] = useCentrifugeQuery(['loans', poolId], (cent) => cent.pools.getLoans([poolId]), {
    suspense: true,
    enabled: !isTinlakePool,
  })

  const { data: tinlakeLoans } = useTinlakeLoans(poolId)

  return isTinlakePool ? tinlakeLoans : centLoans
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
  const loans = useLoans(poolId)

  return loans && [...loans].find((loan) => loan.id === assetId)
}

export function useNftDocumentId(collectionId?: string, nftId?: string) {
  const [result] = useCentrifugeQuery(
    ['docId', collectionId, nftId],
    (cent) => cent.nfts.getNftDocumentId([collectionId!, nftId!]),
    {
      enabled: !!collectionId && !!nftId,
    }
  )

  return result
}

export function useAvailableFinancing(poolId: string, assetId: string) {
  const isTinlakePool = poolId.startsWith('0x')
  const loan = useLoan(poolId, assetId)
  if (!loan) return { current: Dec(0), initial: Dec(0) }

  const initialCeiling = isTinlakePool
    ? (loan as TinlakeLoan).pricing.ceiling?.toDecimal() || Dec(0)
    : (loan as Loan).pricing.value?.toDecimal().mul((loan as Loan).pricing.advanceRate?.toDecimal() || 0) || Dec(0)

  if (loan.status !== 'Active') return { current: initialCeiling, initial: initialCeiling }

  const debtWithMargin = loan.outstandingDebt
    .toDecimal()
    .add(loan.outstandingDebt.toDecimal().mul(loan.pricing.interestRate.toDecimal().div(365 * 8))) // Additional 3 hour interest as margin

  let ceiling = initialCeiling
  // if (loan.pricing.maxBorrowAmount === 'upToTotalBorrowed') {
  //   ceiling = ceiling.minus(loan.totalBorrowed?.toDecimal() || 0)
  // } else {
  //   ceiling = ceiling.minus(debtWithMargin)
  //   ceiling = ceiling.isNegative() ? Dec(0) : ceiling
  // }
  return { current: ceiling, initial: initialCeiling, debtWithMargin }
}
