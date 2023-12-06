import { Loan, Pool, TinlakeLoan } from '@centrifuge/centrifuge-js'
import { LabelValueStack } from '../../components/LabelValueStack'
import { formatDate, getAge } from '../../utils/date'
import { formatBalance, formatPercentage } from '../../utils/formatting'
import { getLatestPrice } from '../../utils/getLatestPrice'
import { TinlakePool } from '../../utils/tinlake/useTinlakePools'
import { useBorrowerTransactions } from '../../utils/usePools'

type Props = {
  loan: Loan | TinlakeLoan
  pool: Pool | TinlakePool
}

export function PricingValues({ loan, pool }: Props) {
  const { pricing } = loan

  const borrowerTransactions = useBorrowerTransactions(loan.poolId)

  const isOutstandingDebtOrDiscountedCashFlow =
    'valuationMethod' in pricing &&
    (pricing.valuationMethod === 'outstandingDebt' || pricing.valuationMethod === 'discountedCashFlow')

  if ('valuationMethod' in pricing && pricing.valuationMethod === 'oracle') {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const days = getAge(new Date(pricing.oracle.timestamp).toISOString())

    const borrowerAssetTransactions = borrowerTransactions?.filter(
      (borrowerTransaction) => borrowerTransaction.loanId === `${loan.poolId}-${loan.id}`
    )
    const latestPrice = getLatestPrice(pricing.oracle.value, borrowerAssetTransactions, pool.currency.decimals)

    return (
      <>
        <LabelValueStack label="ISIN" value={pricing.Isin} />
        <LabelValueStack
          label={`Latest price${pricing.oracle.value.isZero() && latestPrice ? ' (settlement)' : ''}`}
          value={latestPrice ? `${formatBalance(latestPrice, pool.currency.symbol, 6, 2)}` : '-'}
        />
        <LabelValueStack label="Price last updated" value={days === '0' ? `${days} ago` : `Today`} />
      </>
    )
  }

  return (
    <>
      {pricing.maturityDate && <LabelValueStack label="Maturity date" value={formatDate(pricing.maturityDate)} />}
      {'maturityExtensionDays' in pricing && pricing.valuationMethod !== 'cash' && (
        <LabelValueStack label="Extension period" value={`${pricing.maturityExtensionDays} days`} />
      )}
      {isOutstandingDebtOrDiscountedCashFlow && (
        <LabelValueStack
          label="Advance rate"
          value={pricing.advanceRate && formatPercentage(pricing.advanceRate.toPercent())}
        />
      )}
      {'valuationMethod' in pricing && pricing.valuationMethod !== 'cash' && (
        <LabelValueStack
          label="Interest rate"
          value={pricing.interestRate && formatPercentage(pricing.interestRate.toPercent())}
        />
      )}
      {'valuationMethod' in pricing && pricing.valuationMethod === 'discountedCashFlow' && (
        <>
          <LabelValueStack
            label="Probability of default"
            value={pricing.probabilityOfDefault && formatPercentage(pricing.probabilityOfDefault.toPercent())}
          />
          <LabelValueStack
            label="Loss given default"
            value={pricing.lossGivenDefault && formatPercentage(pricing.lossGivenDefault.toPercent())}
          />
          <LabelValueStack
            label="Expected loss"
            value={
              pricing.lossGivenDefault &&
              pricing.probabilityOfDefault &&
              formatPercentage(pricing.lossGivenDefault.toFloat() * pricing.probabilityOfDefault.toFloat() * 100)
            }
          />
          <LabelValueStack
            label="Discount rate"
            value={pricing.discountRate && formatPercentage(pricing.discountRate.toPercent())}
          />
        </>
      )}
    </>
  )
}
