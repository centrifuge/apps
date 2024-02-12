import { ActiveLoan, Loan, TinlakeLoan } from '@centrifuge/centrifuge-js'
import { Box, Card, Shelf, Stack, Text } from '@centrifuge/fabric'
import capitalize from 'lodash/capitalize'
import startCase from 'lodash/startCase'
import { daysBetween } from '../../utils/date'

type Props = {
  assetType?: { class: string; subClass: string }
  averageMaturity: string
  loans: TinlakeLoan[] | Loan[] | null | undefined
}

export const KeyMetrics = ({ assetType, averageMaturity, loans }: Props) => {
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
      return loan.status === 'Active' && loan.pricing.maturityDate && days < 0
    }).length

  const metrics = [
    {
      metric: 'Asset class',
      value: capitalize(startCase(assetType?.subClass)).replace(/^Us /, 'US '),
    },
    {
      metric: 'Pool type',
      value: capitalize(startCase(assetType?.class)).replace(/^Us /, 'US '),
    },
    {
      metric: 'Average asset maturity',
      value: averageMaturity,
    },
    {
      metric: 'Total assets',
      value: loans?.length || 0,
    },
    {
      metric: 'Ongoing assets',
      value: ongoingAssetCount,
    },
    {
      metric: 'Written off assets',
      value: writtenOffAssetCount,
    },
    {
      metric: 'Overdue assets',
      value: overdueAssetCount,
    },
  ]

  return (
    <Card width="100%" height="100%" pt={2} px={3}>
      <Stack gap={2}>
        <Text fontSize="18px" fontWeight="500">
          Key metrics
        </Text>
        <Box>
          {metrics.map(({ metric, value }, index) => (
            <Shelf
              borderStyle="solid"
              borderWidth="1px"
              borderColor="borderSecondary"
              borderTopStyle={index === 0 ? 'solid' : 'none'}
              borderTopWidth={index === 0 ? '1px' : '0'}
              borderTopColor={index === 0 ? 'borderSecondary' : 'none'}
              height={32}
              key={index}
              px={1}
              maxWidth="316px"
            >
              <Box width="160px">
                <Text variant="body3">{metric}</Text>
              </Box>
              <Text variant="body3">{value}</Text>
            </Shelf>
          ))}
        </Box>
      </Stack>
    </Card>
  )
}
