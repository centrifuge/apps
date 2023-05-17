import { Loan, PricingInfo, Rate, TinlakeLoan } from '@centrifuge/centrifuge-js'
import { LabelValueStack } from '../../components/LabelValueStack'
import { formatDate } from '../../utils/date'
import { formatPercentage } from '../../utils/formatting'

export function PricingValues({ loan: { pricing } }: { loan: Loan | TinlakeLoan }) {
  return (
    <>
      {pricing.maturityDate && <LabelValueStack label="Maturity date" value={formatDate(pricing.maturityDate)} />}
      {(pricing as PricingInfo).advanceRate && (
        <LabelValueStack
          label="Advance rate"
          value={
            (pricing as PricingInfo).advanceRate && formatPercentage((pricing as PricingInfo).advanceRate.toPercent())
          }
        />
      )}
      <LabelValueStack
        label="Financing fee"
        value={pricing.interestRate && formatPercentage(pricing.interestRate.toPercent())}
      />
      {(pricing as PricingInfo).valuationMethod === 'discountedCashFlow' && (
        <>
          <LabelValueStack
            label="Probability of default"
            value={
              (pricing as PricingInfo).probabilityOfDefault &&
              formatPercentage(((pricing as PricingInfo).probabilityOfDefault as Rate).toPercent())
            }
          />
          <LabelValueStack
            label="Loss given default"
            value={
              (pricing as PricingInfo).lossGivenDefault &&
              formatPercentage(((pricing as PricingInfo).lossGivenDefault as Rate).toPercent())
            }
          />
          <LabelValueStack
            label="Expected loss"
            value={
              (pricing as PricingInfo).lossGivenDefault &&
              (pricing as PricingInfo).probabilityOfDefault &&
              formatPercentage(
                ((pricing as PricingInfo).lossGivenDefault as Rate).toFloat() *
                  ((pricing as PricingInfo).probabilityOfDefault as Rate).toFloat() *
                  100
              )
            }
          />
          <LabelValueStack
            label="Discount rate"
            value={
              (pricing as PricingInfo).discountRate &&
              formatPercentage(((pricing as PricingInfo).discountRate as Rate).toPercent())
            }
          />
        </>
      )}
    </>
  )
}
