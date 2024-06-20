import { Box, Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import styled, { useTheme } from 'styled-components'
import { daysBetween, formatDate } from '../../utils/date'
import { formatBalance, formatBalanceAbbreviated } from '../../utils/formatting'
import { useLoans } from '../../utils/useLoans'
import { useDailyPoolStates, usePool } from '../../utils/usePools'
import { TooltipContainer, TooltipTitle } from './Tooltip'
import { getRangeNumber } from './utils'

type ChartData = {
  day: Date
  nav: number
  price: number | null
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

function PoolPerformanceChart() {
  const theme = useTheme()
  const chartColor = theme.colors.accentPrimary
  const { pid: poolId } = useParams<{ pid: string }>()
  const { poolStates } = useDailyPoolStates(poolId) || {}
  const pool = usePool(poolId)
  const poolAge = pool.createdAt ? daysBetween(pool.createdAt, new Date()) : 0
  const loans = useLoans(poolId)

  const firstOriginationDate = loans?.reduce((acc, cur) => {
    if ('originationDate' in cur) {
      if (!acc) return cur.originationDate
      return acc < cur.originationDate ? acc : cur.originationDate
    }
    return acc
  }, '')

  const truncatedPoolStates = poolStates?.filter((poolState) => {
    if (firstOriginationDate) {
      return new Date(poolState.timestamp) >= new Date(firstOriginationDate)
    }
    return true
  })

  const [range, setRange] = React.useState<(typeof rangeFilters)[number]>({ value: 'all', label: 'All' })
  const rangeNumber = getRangeNumber(range.value, poolAge) ?? 100

  const data: ChartData[] = React.useMemo(
    () =>
      truncatedPoolStates?.map((day) => {
        const nav = day.poolState.netAssetValue.toDecimal().toNumber()
        const price = Object.values(day.tranches).length === 1 ? Object.values(day.tranches)[0].price?.toFloat() : null

        return { day: new Date(day.timestamp), nav, price }
      }) || [],
    [truncatedPoolStates]
  )

  if (truncatedPoolStates && truncatedPoolStates?.length < 1 && poolAge > 0)
    return <Text variant="body2">No data available</Text>

  // querying chain for more accurate data, since data for today from subquery is not necessarily up to date
  const todayAssetValue = pool?.nav.total.toDecimal().toNumber() || 0
  const todayPrice = data.length > 0 ? data[data.length - 1].price : null

  const chartData = data.slice(-rangeNumber)

  const today = {
    nav: todayAssetValue,
    price: todayPrice,
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

  const priceRange = React.useMemo(() => {
    if (!data) return [0, 100]

    const min =
      data?.reduce((prev, curr) => {
        return prev.price! < curr.price! ? prev : curr
      }, data[0])?.price || 0

    const max =
      data?.reduce((prev, curr) => {
        return prev.price! > curr.price! ? prev : curr
      }, data[0])?.price || 1
    return [min, max]
  }, [data])

  return (
    <Stack gap={2}>
      <Stack>
        <CustomLegend data={today} />
        <Shelf justifyContent="flex-end">
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
            <ComposedChart data={chartData} margin={{ left: -36 }}>
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
                yAxisId="left"
              />
              <YAxis
                stroke="none"
                tickLine={false}
                style={{ fontSize: '10px', fill: theme.colors.textSecondary }}
                tickFormatter={(tick: number) => formatBalanceAbbreviated(tick, '', 6)}
                yAxisId="right"
                orientation="right"
                domain={priceRange}
              />
              <CartesianGrid stroke={theme.colors.borderPrimary} vertical={false} />
              <Tooltip
                content={({ payload }) => {
                  if (payload && payload?.length > 0) {
                    return (
                      <TooltipContainer>
                        <TooltipTitle>{formatDate(payload[0].payload.day)}</TooltipTitle>
                        {payload.map(({ name, value }, index) => (
                          <Shelf justifyContent="space-between" pl="4px" key={index}>
                            <Text variant="label2">{name === 'nav' ? 'NAV' : 'Price'}</Text>
                            <Text variant="label2">
                              {name === 'nav' && typeof value === 'number'
                                ? formatBalance(value, 'USD' || '')
                                : typeof value === 'number'
                                ? formatBalance(value, 'USD' || '', 6)
                                : '-'}
                            </Text>
                          </Shelf>
                        ))}
                      </TooltipContainer>
                    )
                  }
                  return null
                }}
              />
              <Area
                type="monotone"
                dataKey="nav"
                strokeWidth={0}
                fillOpacity={1}
                fill="url(#colorPoolValue)"
                yAxisId="left"
              />

              <Line type="monotone" dataKey="price" stroke="#FFC012" strokeWidth={2} dot={false} yAxisId="right" />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <Text variant="label1">No data yet</Text>
        )}
      </Shelf>
    </Stack>
  )
}

function CustomLegend({
  data,
}: {
  data: {
    nav: number
    price: number | null
  }
}) {
  const theme = useTheme()

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
        <Stack borderLeftWidth="3px" pl={1} borderLeftStyle="solid" borderLeftColor="#FFC012" gap="4px">
          <Text variant="body3" color="textSecondary">
            Token price
          </Text>
          <Text variant="body1">{data.price ? formatBalance(data.price, 'USD', 6) : '-'}</Text>
        </Stack>
      </Grid>
    </Shelf>
  )
}

export default PoolPerformanceChart
