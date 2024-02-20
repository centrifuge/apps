import { Box, Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import styled, { useTheme } from 'styled-components'
import { daysBetween, formatDate } from '../../utils/date'
import { formatBalance, formatBalanceAbbreviated } from '../../utils/formatting'
import { useDailyPoolStates, usePool } from '../../utils/usePools'
import { getRangeNumber } from '../Portfolio/PortfolioValue'
import { TooltipContainer, TooltipTitle } from './Tooltip'

type ChartData = {
  day: Date
  nav: number
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

const chartColor = '#A4D5D8'

function PoolPerformanceChart() {
  const theme = useTheme()
  const { pid: poolId } = useParams<{ pid: string }>()
  const { poolStates } = useDailyPoolStates(poolId) || {}
  const pool = usePool(poolId)
  const poolAge = pool.createdAt ? daysBetween(pool.createdAt, new Date()) : 0

  const [range, setRange] = React.useState<(typeof rangeFilters)[number]>({ value: 'ytd', label: 'Year to date' })
  const rangeNumber = getRangeNumber(range.value, poolAge)

  const data: ChartData[] = React.useMemo(
    () =>
      poolStates?.map((day) => {
        const nav =
          day.poolState.portfolioValuation.toDecimal().toNumber() + day.poolState.totalReserve.toDecimal().toNumber()

        return { day: new Date(day.timestamp), nav }
      }) || [],
    [poolStates]
  )

  if (poolStates && poolStates?.length < 1 && poolAge > 0) return <Text variant="body2">No data available</Text>

  // querying chain for more accurate data, since data for today from subquery is not necessarily up to date
  const todayAssetValue = pool?.nav.latest.toDecimal().toNumber() || 0
  const todayReserve = pool?.reserve.total.toDecimal().toNumber() || 0

  const chartData = data.slice(-rangeNumber)

  const today = {
    day: new Date(),
    nav: todayReserve + todayAssetValue,
    navChange: chartData.length > 0 ? todayReserve + todayAssetValue - chartData[0]?.nav : 0,
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
    <Stack gap={2}>
      <Stack>
        <CustomLegend data={today} />
        <Shelf justifyContent="flex-end" pr="20px">
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
      </Stack>

      <Shelf gap={4} width="100%" color="textSecondary">
        {chartData?.length ? (
          <ResponsiveContainer width="100%" height="100%" minHeight="200px">
            <AreaChart data={chartData} margin={{ left: -36 }}>
              <defs>
                <linearGradient id="colorPoolValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                tickLine={false}
                type="category"
                tickFormatter={(tick: number) => {
                  if (data.length > 180) {
                    return new Date(tick).toLocaleString('en-US', { month: 'short' })
                  }
                  return new Date(tick).toLocaleString('en-US', { day: 'numeric', month: 'short' })
                }}
                style={{ fontSize: '10px', fill: theme.colors.textSecondary, letterSpacing: '-0.5px' }}
                dy={4}
                interval={getXAxisInterval()}
              />
              <YAxis
                stroke="none"
                tickLine={false}
                style={{ fontSize: '10px', fill: theme.colors.textSecondary }}
                tickFormatter={(tick: number) => formatBalanceAbbreviated(tick, '', 0)}
              />
              <CartesianGrid stroke={theme.colors.borderSecondary} vertical={false} />
              <Tooltip
                content={({ payload }) => {
                  if (payload && payload?.length > 0) {
                    return (
                      <TooltipContainer>
                        <TooltipTitle>{formatDate(payload[0].payload.day)}</TooltipTitle>
                        {payload.map(({ value }, index) => (
                          <Shelf justifyContent="space-between" pl="4px" key={index}>
                            <Text variant="label2">NAV</Text>
                            <Text variant="label2">
                              {typeof value === 'number' ? formatBalance(value, 'USD' || '') : '-'}
                            </Text>
                          </Shelf>
                        ))}
                      </TooltipContainer>
                    )
                  }
                  return null
                }}
              />
              <Area type="monotone" dataKey="nav" strokeWidth={0} fillOpacity={1} fill="url(#colorPoolValue)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <Text variant="label1">No data yet</Text>
        )}
      </Shelf>
    </Stack>
  )
}

function CustomLegend({ data }: { data: any }) {
  const theme = useTheme()

  const navChangePercentageChange = (data.navChange / data.nav) * 100
  const navChangePercentageChangeString =
    data.navChange === data.nav || navChangePercentageChange === 0
      ? ''
      : ` (${navChangePercentageChange > 0 ? '+' : ''}${navChangePercentageChange.toFixed(2)}%)`

  return (
    <Shelf bg="backgroundPage" width="100%" gap={2}>
      <Grid pb={2} gridTemplateColumns="fit-content(100%) fit-content(100%)" width="100%" gap={8}>
        <Stack
          borderLeftWidth="3px"
          pl={1}
          borderLeftStyle="solid"
          borderLeftColor={theme.colors.accentPrimary}
          gap="4px"
        >
          <Text variant="body3" color="textSecondary">
            NAV
          </Text>
          <Text variant="body1">{formatBalance(data.nav, 'USD')}</Text>
        </Stack>
        <Stack
          borderLeftWidth="3px"
          pl={1}
          borderLeftStyle="solid"
          borderLeftColor={theme.colors.textPrimary}
          gap="4px"
        >
          <Text variant="body3" color="textSecondary">
            NAV change
          </Text>
          <Text variant="body1" color={data.navChange > 0 && 'statusOk'}>
            {data.navChange > 0 && '+'}
            {formatBalance(data.navChange, 'USD')}
            {navChangePercentageChangeString}
          </Text>
        </Stack>
      </Grid>
    </Shelf>
  )
}

export default PoolPerformanceChart
