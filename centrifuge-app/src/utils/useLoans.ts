import { useCentrifugeQuery } from '@centrifuge/centrifuge-react'
import { combineLatest } from 'rxjs'
import { map } from 'rxjs/operators'
import { Dec } from './Decimal'

export function useLoans(poolId: string) {
  const isTinlakePool = poolId.startsWith('0x')
  const [result] = useCentrifugeQuery(['loans', poolId], (cent) => cent.pools.getLoans([poolId]), {
    suspense: true,
    enabled: !isTinlakePool,
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
  const loans = useLoans(poolId)
  const loan = loans?.find((loan) => loan.id === assetId)
  return loan
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
  const loan = useLoan(poolId, assetId)
  if (!loan) return { current: Dec(0), initial: Dec(0) }
  const initialCeiling = loan.pricing.value.toDecimal().mul(loan.pricing.advanceRate.toDecimal())
  if (loan.status !== 'Active') return { current: initialCeiling, initial: initialCeiling }

  const debtWithMargin = loan.outstandingDebt
    .toDecimal()
    .add(loan.outstandingDebt.toDecimal().mul(loan.pricing.interestRate.toDecimal().div(365 * 8))) // Additional 3 hour interest as margin

  let ceiling = initialCeiling
  if (loan.pricing.maxBorrowAmount === 'upToTotalBorrowed') {
    ceiling = ceiling.minus(loan.totalBorrowed?.toDecimal() || 0)
  } else {
    ceiling = ceiling.minus(debtWithMargin)
    ceiling = ceiling.isNegative() ? Dec(0) : ceiling
  }
  return { current: ceiling, initial: initialCeiling, debtWithMargin }
}
