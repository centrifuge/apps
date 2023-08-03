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

  if (!isTinlakePool && 'valuationMethod' in loan.pricing && loan.pricing.valuationMethod === 'oracle') {
    return loan.pricing.maxBorrowAmount
      ? {
          current: loan.pricing.maxBorrowAmount.toDecimal().sub(loan.pricing.outstandingQuantity.toDecimal()),
          initial: loan.pricing.maxBorrowAmount.toDecimal(),
          debtWithMargin: loan.pricing.maxBorrowAmount
            .toDecimal()
            .sub(loan.pricing.outstandingQuantity.toDecimal())
            .mul(loan.pricing.oracle.value.toDecimal()),
        }
      : { current: Dec(100000000), initial: Dec(100000000) }
  }

  const initialCeiling = isTinlakePool
    ? 'ceiling' in loan.pricing
      ? loan.pricing.ceiling.toDecimal()
      : Dec(0)
    : 'value' in loan.pricing && 'advanceRate' in loan.pricing
    ? loan.pricing.value.toDecimal().mul(loan.pricing.advanceRate.toDecimal())
    : Dec(0)

  if (loan.status !== 'Active') return { current: initialCeiling, initial: initialCeiling }

  const debtWithMargin =
    'interestRate' in loan.pricing
      ? loan.outstandingDebt
          .toDecimal()
          .add(loan.outstandingDebt.toDecimal().mul(loan.pricing.interestRate.toDecimal().div(365 * 8))) // Additional 3 hour interest as margin
      : Dec(0)

  let ceiling = initialCeiling
  if ('maxBorrowAmount' in loan.pricing && loan.pricing.maxBorrowAmount === 'upToTotalBorrowed') {
    ceiling = ceiling.minus(loan.totalBorrowed?.toDecimal() || 0)
  } else {
    ceiling = ceiling.minus(debtWithMargin)
    ceiling = ceiling.isNegative() ? Dec(0) : ceiling
  }
  return { current: ceiling, initial: initialCeiling, debtWithMargin }
}
