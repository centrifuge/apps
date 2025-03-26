import { useCentrifugeQuery } from '@centrifuge/centrifuge-react'
import { Dec } from './Decimal'
import { useTinlakeLoans } from './tinlake/useTinlakePools'

export function useLoans(poolIds: string[]) {
  const isTinlakePool = poolIds.length === 1 && poolIds[0]?.startsWith('0x')

  const { data: tinlakeLoans, isLoading: isLoadingTinlake } = useTinlakeLoans(poolIds?.[0])

  const [centLoans, isLoading] = useCentrifugeQuery(['loans', poolIds], (cent) => cent.pools.getLoans({ poolIds }), {
    suspense: true,
    enabled: !isTinlakePool,
  })
  return { data: isTinlakePool ? tinlakeLoans : centLoans, isLoading: isTinlakePool ? isLoadingTinlake : isLoading }
}

export function useLoan(poolId: string, assetId: string | undefined) {
  const { data: loans } = useLoans([poolId])
  return loans?.find((loan) => loan.id === assetId)
}

export function useAvailableFinancing(poolId: string, assetId: string) {
  const isTinlakePool = poolId.startsWith('0x')
  const loan = useLoan(poolId, assetId)
  if (!loan) return { current: Dec(0), initial: Dec(0) }

  if (!isTinlakePool && 'valuationMethod' in loan.pricing && loan.pricing.valuationMethod === 'oracle') {
    let latestOraclePrice = loan.pricing.oracle[0]
    loan.pricing.oracle.forEach((price) => {
      if (price.timestamp > latestOraclePrice.timestamp) {
        latestOraclePrice = price
      }
    })
    return loan.pricing.maxBorrowAmount
      ? {
          current: loan.pricing.maxBorrowAmount.toDecimal().sub(loan.pricing.outstandingQuantity.toDecimal()),
          initial: loan.pricing.maxBorrowAmount.toDecimal(),
          debtWithMargin: loan.pricing.maxBorrowAmount
            .toDecimal()
            .sub(loan.pricing.outstandingQuantity.toDecimal())
            .mul(latestOraclePrice.value.toDecimal()),
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
    'interestRate' in loan.pricing && 'outstandingPrincipal' in loan
      ? loan.outstandingDebt
          .toDecimal()
          .add(loan.outstandingPrincipal.toDecimal().mul(loan.pricing.interestRate.toDecimal().div(365 * 8))) // Additional 3 hour interest as margin
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
