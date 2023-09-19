import { CurrencyBalance, Loan, Pool, TinlakeLoan } from '@centrifuge/centrifuge-js'
import { LabelValueStack } from '../../components/LabelValueStack'
import { formatDate, getAge } from '../../utils/date'
import { formatBalance, formatPercentage } from '../../utils/formatting'
import { TinlakePool } from '../../utils/tinlake/useTinlakePools'

type Props = {
  loan: Loan | TinlakeLoan
  pool: Pool | TinlakePool
  latestPrice: CurrencyBalance
}

export function PricingValues({ loan: { pricing }, pool, latestPrice }: Props) {
  const isOutstandingDebtOrDiscountedCashFlow =
    'valuationMethod' in pricing &&
    (pricing.valuationMethod === 'outstandingDebt' || pricing.valuationMethod === 'discountedCashFlow')

  if ('valuationMethod' in pricing && pricing.valuationMethod === 'oracle') {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const days = getAge(new Date(pricing.oracle.timestamp).toISOString())

    return (
      <>
        <LabelValueStack label="ISIN" value={pricing.Isin} />
        <LabelValueStack
          label={`Latest price${pricing.oracle.value.isZero() ? ' (settlement)' : ''}`}
          value={`${formatBalance(latestPrice, pool.currency.symbol, 6, 2)}`}
        />
        <LabelValueStack label="Price last updated" value={days === '0' ? `${days} ago` : `Today`} />
      </>
    )
  }

  return (
    <>
      {pricing.maturityDate && <LabelValueStack label="Maturity date" value={formatDate(pricing.maturityDate)} />}
      {'maturityExtensionDays' in pricing && (
        <LabelValueStack label="Extension period" value={`${pricing.maturityExtensionDays} days`} />
      )}
      {isOutstandingDebtOrDiscountedCashFlow && (
        <LabelValueStack
          label="Advance rate"
          value={pricing.advanceRate && formatPercentage(pricing.advanceRate.toPercent())}
        />
      )}
      <LabelValueStack
        label="Interest rate"
        value={pricing.interestRate && formatPercentage(pricing.interestRate.toPercent())}
      />
      {isOutstandingDebtOrDiscountedCashFlow && pricing.valuationMethod === 'discountedCashFlow' && (
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
