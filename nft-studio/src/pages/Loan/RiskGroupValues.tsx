import { Rate } from '@centrifuge/centrifuge-js'
import { Shelf } from '@centrifuge/fabric'
import BN from 'bn.js'
import * as React from 'react'
import { LabelValueStack } from '../../components/LabelValueStack'
import { formatDate } from '../../utils/date'
import { formatPercentage } from '../../utils/formatting'
import { LOAN_FIELDS } from './utils'

export const RiskGroupValues: React.FC<{
  values: {
    advanceRate: string | BN
    interestRatePerSec: string | BN
    probabilityOfDefault?: string | BN
    lossGivenDefault?: string | BN
    discountRate?: string | BN
    maturityDate?: string
  }
  loanType: 'BulletLoan' | 'CreditLine' | 'CreditLineWithMaturity'
  showMaturityDate?: boolean
}> = ({ values, loanType, showMaturityDate }) => {
  const shownFields = LOAN_FIELDS[loanType]

  const advanceRate = values?.advanceRate ? new Rate(values.advanceRate) : undefined
  const fee = values?.interestRatePerSec ? new Rate(values.interestRatePerSec) : undefined
  const probabilityOfDefault = values?.probabilityOfDefault ? new Rate(values.probabilityOfDefault) : undefined
  const lossGivenDefault = values?.lossGivenDefault ? new Rate(values.lossGivenDefault) : undefined
  const discountRate = values?.discountRate ? new Rate(values.discountRate) : undefined

  return (
    <Shelf gap={3} flexWrap="wrap">
      {showMaturityDate && values.maturityDate && (
        <LabelValueStack label="Maturity date" value={formatDate(values.maturityDate)} />
      )}
      <LabelValueStack label="Advance rate" value={advanceRate && formatPercentage(advanceRate.toPercent())} />
      <LabelValueStack label="Financing fee" value={fee && formatPercentage(fee.toAprPercent())} />

      {shownFields.includes('probabilityOfDefault') && (
        <>
          <LabelValueStack
            label="Probability of default"
            value={probabilityOfDefault && formatPercentage(probabilityOfDefault.toPercent())}
          />
          <LabelValueStack
            label="Loss given default"
            value={lossGivenDefault && formatPercentage(lossGivenDefault.toPercent())}
          />
          <LabelValueStack
            label="Expected loss"
            value={
              lossGivenDefault &&
              probabilityOfDefault &&
              formatPercentage(lossGivenDefault.toFloat() * probabilityOfDefault.toFloat() * 100)
            }
          />
          =
        </>
      )}
      {shownFields.includes('discountRate') && (
        <LabelValueStack label="Discount rate" value={discountRate && formatPercentage(discountRate.toAprPercent())} />
      )}
    </Shelf>
  )
}
