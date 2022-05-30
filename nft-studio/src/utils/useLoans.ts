import { combineLatest } from 'rxjs'
import { map } from 'rxjs/operators'
import { Dec } from './Decimal'
import { useCentrifugeQuery } from './useCentrifugeQuery'

const SEC_PER_DAY = 24 * 60 * 60

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

export function useAvailableFinancing(poolId: string, assetId: string) {
  const loan = useLoan(poolId, assetId)
  if (!loan) return { current: Dec(0), initial: Dec(0) }

  const debt = loan.outstandingDebt.toDecimal()
  const debtWithMargin = debt.add(
    loan.principalDebt.toDecimal().mul(loan.interestRatePerSec.toDecimal().minus(1).mul(SEC_PER_DAY))
  )

  const initialCeiling = loan.loanInfo.value.toDecimal().mul(loan.loanInfo.advanceRate.toDecimal())
  let ceiling = initialCeiling
  if (loan.loanInfo.type === 'BulletLoan') {
    ceiling = ceiling.minus(loan.totalBorrowed.toDecimal())
  } else {
    ceiling = ceiling.minus(debtWithMargin)
    ceiling = ceiling.isNegative() ? Dec(0) : ceiling
  }
  return { current: ceiling, initial: initialCeiling }
}
