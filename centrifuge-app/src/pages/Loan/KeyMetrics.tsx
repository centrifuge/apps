import { CurrencyBalance, ExternalPricingInfo, Loan, Pool, TinlakeLoan } from '@centrifuge/centrifuge-js'
import { Box, Card, Grid, Stack, Text } from '@centrifuge/fabric'
import React from 'react'
import { Tooltips } from '../../components/Tooltips'
import { nftMetadataSchema } from '../../schemas'
import { LoanTemplate } from '../../types'
import { Dec } from '../../utils/Decimal'
import { daysBetween, formatDate, isValidDate } from '../../utils/date'
import { formatPercentage } from '../../utils/formatting'
import { useMetadata } from '../../utils/useMetadata'
import { useCentNFT } from '../../utils/useNFTs'
import { useBorrowerAssetTransactions, usePoolMetadata } from '../../utils/usePools'

type Props = {
  pool: Pool
  loan: Loan | TinlakeLoan
}

export const KeyMetrics = ({ pool, loan }: Props) => {
  const { data: poolMetadata } = usePoolMetadata(pool)
  const borrowerAssetTransactions = useBorrowerAssetTransactions(pool.id, loan.id)

  const templateIds = poolMetadata?.loanTemplates?.map((s) => s.id) ?? []
  const templateId = templateIds.at(-1)
  const { data: templateMetadata } = useMetadata<LoanTemplate>(templateId)

  const nft = useCentNFT(loan?.asset.collectionId, loan?.asset.nftId, false)
  const { data: nftMetadata, isLoading: nftMetadataIsLoading } = useMetadata(nft?.metadataUri, nftMetadataSchema)

  const currentFace =
    loan?.pricing && 'outstandingQuantity' in loan.pricing
      ? loan.pricing.outstandingQuantity.toDecimal().mul(loan.pricing.notional.toDecimal())
      : null

  const currentYTM = React.useMemo(() => {
    const termDays = loan?.pricing ? daysBetween(new Date(), loan?.pricing.maturityDate) : 0

    return currentFace && loan && 'presentValue' in loan && termDays > 0
      ? currentFace
          ?.sub(loan.presentValue.toDecimal())
          .div(loan.presentValue.toDecimal())
          .mul(Dec(365).div(Dec(termDays)))
          .mul(100)
      : null
  }, [loan])

  const weightedYTM = React.useMemo(() => {
    if (
      loan?.pricing &&
      'valuationMethod' in loan.pricing &&
      loan.pricing.valuationMethod === 'oracle' &&
      loan.pricing.interestRate.isZero()
    ) {
      return borrowerAssetTransactions
        ?.filter((tx) => tx.type !== 'REPAID')
        .reduce((prev, curr) => {
          const termDays = curr.timestamp
            ? daysBetween(curr.timestamp, loan?.pricing.maturityDate)
            : daysBetween(new Date(), loan?.pricing.maturityDate)

          const faceValue =
            curr.quantity && (loan.pricing as ExternalPricingInfo).notional
              ? new CurrencyBalance(curr.quantity, 18)
                  .toDecimal()
                  .mul((loan.pricing as ExternalPricingInfo).notional.toDecimal())
              : null

          const yieldToMaturity =
            curr.amount && faceValue && termDays > 0
              ? faceValue
                  ?.sub(curr.amount.toDecimal())
                  .div(curr.amount.toDecimal())
                  .mul(Dec(365).div(Dec(termDays)))
                  .mul(100)
              : null
          return yieldToMaturity?.mul(curr.quantity!).add(prev) || prev
        }, Dec(0))
    }
    return null
  }, [loan, borrowerAssetTransactions])

  const averageWeightedYTM = React.useMemo(() => {
    if (borrowerAssetTransactions?.length && weightedYTM) {
      const sum = borrowerAssetTransactions
        .filter((tx) => tx.type !== 'REPAID')
        .reduce((prev, curr) => {
          return curr.quantity ? Dec(curr.quantity).add(prev) : prev
        }, Dec(0))
      return sum.isZero() ? Dec(0) : weightedYTM.div(sum)
    }
  }, [weightedYTM])

  const metrics = [
    ...('valuationMethod' in loan.pricing && loan.pricing.valuationMethod !== 'cash'
      ? templateMetadata?.keyAttributes
          ?.filter((key) => templateMetadata?.attributes?.[key].public)
          .map((key) => ({
            label: templateMetadata?.attributes?.[key].label,
            value: isValidDate(nftMetadata?.properties[key])
              ? formatDate(nftMetadata?.properties[key])
              : nftMetadata?.properties[key],
          })) || []
      : []),
    ...(loan.pricing.maturityDate && 'valuationMethod' in loan.pricing && loan.pricing.valuationMethod !== 'cash'
      ? [
          {
            label: 'Maturity date',
            value: formatDate(loan.pricing.maturityDate),
          },
        ]
      : []),
    ...(loan.pricing.maturityDate &&
    'valuationMethod' in loan.pricing &&
    loan.pricing.valuationMethod === 'oracle' &&
    loan.pricing.notional.gtn(0) &&
    currentYTM
      ? [{ label: <Tooltips type="currentYtm" />, value: formatPercentage(currentYTM) }]
      : []),
    ...(loan.pricing.maturityDate &&
    'valuationMethod' in loan.pricing &&
    loan.pricing.valuationMethod === 'oracle' &&
    loan.pricing.notional.gtn(0) &&
    averageWeightedYTM
      ? [{ label: <Tooltips type="averageYtm" />, value: formatPercentage(averageWeightedYTM) }]
      : []),
  ]

  return (
    <Card p={3}>
      <Stack gap={2}>
        <Text fontSize="18px" fontWeight="500">
          Key metrics
        </Text>
        <Box borderStyle="solid" borderWidth="1px" borderColor="borderPrimary">
          {metrics.map(({ label, value }, index) => (
            <Grid
              borderBottomStyle={index === metrics.length - 1 ? 'none' : 'solid'}
              borderBottomWidth={index === metrics.length - 1 ? '0' : '1px'}
              borderBottomColor={index === metrics.length - 1 ? 'none' : 'borderPrimary'}
              height={32}
              key={index}
              px={1}
              gridTemplateColumns="1fr 1fr"
              width="100%"
              alignItems="center"
              gap={2}
            >
              <Text variant="body3" textOverflow="ellipsis" whiteSpace="nowrap">
                {label}
              </Text>
              <Text variant="body3" textOverflow="ellipsis" whiteSpace="nowrap">
                {value}
              </Text>
            </Grid>
          ))}
        </Box>
      </Stack>
    </Card>
  )
}
