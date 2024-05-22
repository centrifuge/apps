import { ActiveLoan, Loan, TinlakeLoan } from '@centrifuge/centrifuge-js'
import { Box, Card, Grid, Stack, Text } from '@centrifuge/fabric'
import capitalize from 'lodash/capitalize'
import startCase from 'lodash/startCase'
import { daysBetween } from '../../utils/date'

type Props = {
  assetType?: { class: string; subClass: string }
  averageMaturity: string
  loans: TinlakeLoan[] | Loan[] | null | undefined
  poolId: string
}

export const KeyMetrics = ({ assetType, averageMaturity, loans, poolId }: Props) => {
  const ongoingAssetCount =
    loans && [...loans].filter((loan) => loan.status === 'Active' && !loan.outstandingDebt.isZero()).length

  const writtenOffAssetCount =
    loans && [...loans].filter((loan) => loan.status === 'Active' && (loan as ActiveLoan).writeOffStatus).length

  const overdueAssetCount =
    loans &&
    [...loans].filter((loan) => {
      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)
      const days = daysBetween(today, loan.pricing.maturityDate)
      return loan.status === 'Active' && loan.pricing.maturityDate && days < 0 && !loan.outstandingDebt.isZero()
    }).length

  const isBT3BT4 =
    poolId.toLowerCase() === '0x90040f96ab8f291b6d43a8972806e977631affde' ||
    poolId.toLowerCase() === '0x55d86d51ac3bcab7ab7d2124931fba106c8b60c7'

  const metrics = [
    {
      metric: 'Asset class',
      value: `${capitalize(startCase(assetType?.class)).replace(/^Us /, 'US ')} - ${capitalize(
        startCase(assetType?.subClass)
      ).replace(/^Us /, 'US ')}`,
    },
    ...(isBT3BT4
      ? []
      : [
          {
            metric: 'Average asset maturity',
            value: averageMaturity,
          },
        ]),
    {
      metric: 'Total assets',
      value: loans?.length || 0,
    },
    {
      metric: 'Ongoing assets',
      value: ongoingAssetCount,
    },
    ...(writtenOffAssetCount
      ? [
          {
            metric: 'Written off assets',
            value: writtenOffAssetCount,
          },
        ]
      : []),
    ...(overdueAssetCount
      ? [
          {
            metric: 'Overdue assets',
            value: overdueAssetCount,
          },
        ]
      : []),
  ]

  return (
    <Card p={3}>
      <Stack gap={2}>
        <Text fontSize="18px" fontWeight="500">
          Key metrics
        </Text>
        <Box borderStyle="solid" borderWidth="1px" borderColor="borderPrimary">
          {metrics.map(({ metric, value }, index) => (
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
                {metric}
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
