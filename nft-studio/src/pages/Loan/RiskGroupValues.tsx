import { Rate } from '@centrifuge/centrifuge-js'
import { Shelf, Stack, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import * as React from 'react'
import { formatPercentage } from '../../utils/formatting'
import { LOAN_FIELDS } from './utils'

export const RiskGroupValues: React.FC<{
  values: {
    advanceRate: string | BN
    interestRatePerSec: string | BN
    probabilityOfDefault?: string | BN
    lossGivenDefault?: string | BN
    discountRate?: string | BN
  }
  loanType: 'BulletLoan' | 'CreditLine' | 'CreditLineWithMaturity'
}> = ({ values, loanType }) => {
  const shownFields = LOAN_FIELDS[loanType]

  const advanceRate = values?.advanceRate ? new Rate(values.advanceRate) : undefined
  const fee = values?.interestRatePerSec ? new Rate(values.interestRatePerSec) : undefined
  const probabilityOfDefault = values?.probabilityOfDefault ? new Rate(values.probabilityOfDefault) : undefined
  const lossGivenDefault = values?.lossGivenDefault ? new Rate(values.lossGivenDefault) : undefined
  const discountRate = values?.discountRate ? new Rate(values.discountRate) : undefined

  return (
    <Shelf gap={3} flexWrap="wrap">
      <Stack gap="4px">
        <Text variant="label2">Advance rate</Text>
        <Text variant="body2">{advanceRate && formatPercentage(advanceRate.toPercent())}</Text>
      </Stack>

      <Stack gap="4px">
        <Text variant="label2">Financing fee</Text>
        <Text variant="body2">{fee && formatPercentage(fee.toAprPercent())}</Text>
      </Stack>

      {shownFields.includes('probabilityOfDefault') && (
        <>
          <Stack gap="4px">
            <Text variant="label2">Probability of default</Text>
            <Text variant="body2">{probabilityOfDefault && formatPercentage(probabilityOfDefault.toPercent())}</Text>
          </Stack>

          <Stack gap="4px">
            <Text variant="label2">Loss given default</Text>
            <Text variant="body2">{lossGivenDefault && formatPercentage(lossGivenDefault.toPercent())}</Text>
          </Stack>
          <Stack gap="4px">
            <Text variant="label2">Expected loss</Text>
            <Text variant="body2">
              {lossGivenDefault &&
                probabilityOfDefault &&
                formatPercentage(lossGivenDefault.toFloat() * probabilityOfDefault.toFloat() * 100)}
            </Text>
          </Stack>
        </>
      )}
      {shownFields.includes('discountRate') && (
        <Stack>
          <Text variant="label2">Discount rate</Text>
          <Text variant="body2">{discountRate && formatPercentage(discountRate.toAprPercent())}</Text>
        </Stack>
      )}
    </Shelf>
  )
}
