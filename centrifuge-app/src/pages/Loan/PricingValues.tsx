import { Loan } from '@centrifuge/centrifuge-js'
import { LabelValueStack } from '../../components/LabelValueStack'
import { formatDate } from '../../utils/date'
import { formatPercentage } from '../../utils/formatting'

export function PricingValues({ loan: { pricing } }: { loan: Loan }) {
  return (
    <>
      {pricing.maturityDate && <LabelValueStack label="Maturity date" value={formatDate(pricing.maturityDate)} />}
      {pricing.advanceRate && (
        <LabelValueStack
          label="Advance rate"
          value={pricing.advanceRate && formatPercentage(pricing.advanceRate.toPercent())}
        />
      )}
      <LabelValueStack
        label="Financing fee"
        value={pricing.interestRate && formatPercentage(pricing.interestRate.toPercent())}
      />
      {pricing.valuationMethod === 'discountedCashFlow' && (
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
