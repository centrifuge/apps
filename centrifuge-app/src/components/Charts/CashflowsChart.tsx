import { CurrencyBalance, DailyPoolState, Pool } from '@centrifuge/centrifuge-js'
import { Box, Shelf, Stack, Text } from '@centrifuge/fabric'
import capitalize from 'lodash/capitalize'
import startCase from 'lodash/startCase'
import * as React from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import styled, { useTheme } from 'styled-components'
import { daysBetween, formatDate } from '../../utils/date'
import { formatBalance, formatBalanceAbbreviated } from '../../utils/formatting'
import { TinlakePool } from '../../utils/tinlake/useTinlakePools'
import { TooltipContainer, TooltipTitle } from '../Charts/Tooltip'
import { getRangeNumber } from './utils'

type Props = {
  poolStates?: DailyPoolState[]
  pool: Pool | TinlakePool
}

const RangeFilterButton = styled(Stack)`
  &:hover {
    cursor: pointer;
  }
`

const rangeFilters = [
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'ytd', label: 'Year to date' },
  { value: 'all', label: 'All' },
] as const

export const CashflowsChart = ({ poolStates, pool }: Props) => {
  const theme = useTheme()
  const [range, setRange] = React.useState<(typeof rangeFilters)[number]>({ value: 'ytd', label: 'Year to date' })

  const poolAge = pool.createdAt ? daysBetween(pool.createdAt, new Date()) : 0
  const rangeNumber = getRangeNumber(range.value, poolAge) ?? 100

  const data = React.useMemo(
    () =>
      poolStates?.map((day) => {
        const purchases = new CurrencyBalance(day.sumBorrowedAmountByPeriod, pool.currency.decimals).toFloat()
        const principalRepayments = new CurrencyBalance(
          day.sumPrincipalRepaidAmountByPeriod,
          pool.currency.decimals
        ).toFloat()

        const interest =
          new CurrencyBalance(day.sumInterestRepaidAmountByPeriod, pool.currency.decimals).toFloat() +
          new CurrencyBalance(day.sumUnscheduledRepaidAmountByPeriod, pool.currency.decimals).toFloat()
        const fees = new CurrencyBalance(day.sumPoolFeesPaidAmountByPeriod ?? 0, pool.currency.decimals).toFloat()
        return { name: new Date(day.timestamp), purchases, principalRepayments, interest, fees }
      }) || [],
    [poolStates, pool.currency.decimals]
  )

  const chartData = data.slice(-rangeNumber)

  const today = {
    totalPurchases: data.reduce((acc, cur) => acc + cur.purchases, 0),
    interest: data.reduce((acc, cur) => acc + cur.interest, 0),
    principalRepayments: data.reduce((acc, cur) => acc + cur.principalRepayments, 0),
    fees: data.reduce((acc, cur) => acc + cur.fees, 0),
  }

  const getXAxisInterval = () => {
    if (rangeNumber <= 30) return 5
    if (rangeNumber > 30 && rangeNumber <= 90) {
      return 14
    }
    if (rangeNumber > 90 && rangeNumber <= 180) {
      return 30
    }
    return 45
  }

  return (
    <Stack gap={4}>
      <Shelf gap={2}>
        <CustomLegend data={today} />
        <Shelf justifyContent="flex-end" pr={1}>
          {chartData.length > 0 &&
            rangeFilters.map((rangeFilter, index) => (
              <React.Fragment key={rangeFilter.label}>
                <RangeFilterButton gap={1} onClick={() => setRange(rangeFilter)}>
                  <Text variant="body3" whiteSpace="nowrap">
                    <Text variant={rangeFilter.value === range.value && 'emphasized'}>{rangeFilter.label}</Text>
                  </Text>
                  <Box
                    width="100%"
                    backgroundColor={rangeFilter.value === range.value ? '#000000' : '#E0E0E0'}
                    height="2px"
                  />
                </RangeFilterButton>
                {index !== rangeFilters.length - 1 && (
                  <Box width="24px" backgroundColor="#E0E0E0" height="2px" alignSelf="flex-end" />
                )}
              </React.Fragment>
            ))}
        </Shelf>
      </Shelf>
      <Box height="100%" width="100%" color="textSecondary">
        <ResponsiveContainer width="100%" height="100%" minHeight="200px">
          <BarChart data={chartData} margin={{ left: -20, right: 24 }} barGap={0} barSize={16}>
            <CartesianGrid stroke={theme.colors.borderPrimary} vertical={false} />
            <XAxis
              dataKey="name"
              style={{ fontSize: '10px', fill: theme.colors.textSecondary }}
              tickLine={false}
              stroke={theme.colors.borderPrimary}
              tickFormatter={(tick: number) => {
                if (data.length > 180) {
                  return new Date(tick).toLocaleString('en-US', { month: 'short' })
                }
                return new Date(tick).toLocaleString('en-US', { day: 'numeric', month: 'short' })
              }}
              interval={getXAxisInterval()}
            />
            <YAxis
              style={{ fontSize: '10px', fill: theme.colors.textSecondary }}
              tickLine={false}
              stroke={theme.colors.borderPrimary}
              tickFormatter={(tick: number) => formatBalanceAbbreviated(tick, '', 0)}
            />
            <Tooltip
              cursor={false}
              content={({ payload, label }) => {
                if (payload) {
                  return (
                    <TooltipContainer>
                      <TooltipTitle>{formatDate(label)}</TooltipTitle>
                      {payload.map(({ color, name, value }, index) => {
                        return (
                          <Stack>
                            <Shelf justifyContent="space-between" pl="4px" gap={4} key={index}>
                              <Shelf gap="4px">
                                <Box height="8px" width="8px" backgroundColor={color} borderRadius="50%" />
                                <Text variant="label2">
                                  {typeof name === 'string' ? capitalize(startCase(name)) : '-'}
                                </Text>
                              </Shelf>
                              <Text variant="label2">
                                {typeof value === 'number' ? formatBalance(value, 'USD', 2, 2) : '-'}
                              </Text>
                            </Shelf>
                          </Stack>
                        )
                      })}
                    </TooltipContainer>
                  )
                }
                return null
              }}
            />
            <Bar dataKey="purchases" stackId="a" fill="#001C66" />
            <Bar dataKey="principalRepayments" stackId="b" fill="#A4D5D8" />
            <Bar dataKey="interest" stackId="b" fill={theme.colors.borderSecondary} />
            <Bar dataKey="fees" stackId="a" fill={theme.colors.statusCritical} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Stack>
  )
}

function CustomLegend({
  data,
}: {
  data: {
    totalPurchases: number
    principalRepayments: number
    interest: number
    fees: number
  }
}) {
  const theme = useTheme()

  return (
    <Shelf bg="backgroundPage" width="100%" gap={2}>
      <Shelf gap={3}>
        <Stack borderLeftWidth="3px" pl={1} borderLeftStyle="solid" borderLeftColor="#001C66" gap="4px">
          <Text variant="body3" color="textSecondary" whiteSpace="nowrap">
            Total purchases
          </Text>
          <Text variant="body1" whiteSpace="nowrap">
            {formatBalance(data.totalPurchases, 'USD', 2)}
          </Text>
        </Stack>
        <Stack borderLeftWidth="3px" pl={1} borderLeftStyle="solid" borderLeftColor="#A4D5D8" gap="4px">
          <Text variant="body3" color="textSecondary" whiteSpace="nowrap">
            Principal repayments
          </Text>
          <Text variant="body1" whiteSpace="nowrap">
            {formatBalance(data.principalRepayments, 'USD', 2)}
          </Text>
        </Stack>
        <Stack
          borderLeftWidth="3px"
          pl={1}
          borderLeftStyle="solid"
          borderLeftColor={theme.colors.borderSecondary}
          gap="4px"
        >
          <Text variant="body3" color="textSecondary" whiteSpace="nowrap">
            Interest
          </Text>
          <Text variant="body1" whiteSpace="nowrap">
            {formatBalance(data.interest, 'USD', 2)}
          </Text>
        </Stack>
        <Stack
          borderLeftWidth="3px"
          pl={1}
          borderLeftStyle="solid"
          borderLeftColor={theme.colors.statusCritical}
          gap="4px"
        >
          <Text variant="body3" color="textSecondary">
            Fees
          </Text>
          <Text variant="body1">{formatBalance(data.fees, 'USD', 2)}</Text>
        </Stack>
      </Shelf>
    </Shelf>
  )
}
