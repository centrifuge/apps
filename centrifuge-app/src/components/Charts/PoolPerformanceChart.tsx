import { DailyPoolState, Perquintill, Pool, Token } from '@centrifuge/centrifuge-js'
import { Box, Shelf, Stack, Tabs, TabsItem, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ValueType } from 'recharts/types/component/DefaultTooltipContent'
import { useTheme } from 'styled-components'
import { daysBetween, formatDate } from '../../utils/date'
import { formatBalance, formatBalanceAbbreviated, formatPercentage } from '../../utils/formatting'
import { useLoans } from '../../utils/useLoans'
import { useDailyPoolStates, usePool } from '../../utils/usePools'
import { useDebugFlags } from '../DebugFlags'
import { Tooltips, tooltipText } from '../Tooltips'
import { TooltipContainer, TooltipTitle } from './Tooltip'
import { getOneDayPerMonth, getRangeNumber } from './utils'

type ChartData = {
  day: Date | string
  nav: number
  juniorTokenPrice: number | null
  seniorTokenPrice?: number | null
  currency?: string
  seniorAPY: number | null | undefined
  juniorAPY: number | null | undefined
}

type GraphDataItemWithType = {
  show: boolean
  color: string
  type: keyof typeof tooltipText
  label: string
  value: string | number
}

type GraphDataItemWithoutType = {
  show: boolean
  color: string
  label: string
  value: string | number
}

type GraphDataItem = GraphDataItemWithType | GraphDataItemWithoutType

type CustomTickProps = {
  x: number
  y: number
  payload: {
    value: ValueType
  }
  filterValue?: number
  angle?: number
}

const rangeFilters = [{ value: '90d', label: '90 days' }]

function calculateTranchePrices(pool: Pool) {
  if (!pool?.tranches) return { juniorTokenPrice: 0, seniorTokenPrice: null }

  const juniorTranche = pool.tranches.find((t) => t.seniority === 0)
  const seniorTranche = pool.tranches.length > 1 ? pool.tranches.find((t) => t.seniority === 1) : null

  const juniorTokenPrice =
    juniorTranche && juniorTranche.tokenPrice ? Number(formatBalance(juniorTranche.tokenPrice, undefined, 5, 5)) : 0

  const seniorTokenPrice =
    seniorTranche && seniorTranche.tokenPrice ? Number(formatBalance(seniorTranche.tokenPrice, undefined, 5, 5)) : null

  return { juniorTokenPrice, seniorTokenPrice }
}

function getYieldFieldForFilter(
  tranche?: Pick<Token, 'yield30DaysAnnualized' | 'yield90DaysAnnualized' | 'yieldYTD' | 'yieldSinceInception'>,
  filter?: string
) {
  const zero = new Perquintill(0)
  switch (filter) {
    case '30d':
      return tranche?.yield30DaysAnnualized || zero
    case '90d':
      return tranche?.yield90DaysAnnualized || zero
    case 'ytd':
      return tranche?.yieldYTD || zero
    case 'all':
      return tranche?.yieldSinceInception || zero
    default:
      return zero
  }
}

function PoolPerformanceChart() {
  const theme = useTheme()
  const { showAPYGraph } = useDebugFlags()
  const [selectedTabIndex, setSelectedTabIndex] = React.useState(0)
  const chartColor = theme.colors.textGold
  const { pid: poolId } = useParams<{ pid: string }>()

  if (!poolId) throw new Error('Pool not found')

  const { poolStates } = useDailyPoolStates(poolId) || {}
  const pool = usePool(poolId)
  const poolAge = pool.createdAt ? daysBetween(pool.createdAt, new Date()) : 0
  const { data: loans } = useLoans([poolId])

  const firstOriginationDate = loans?.reduce((acc, cur) => {
    if ('originationDate' in cur) {
      if (!acc) return cur.originationDate
      return acc < cur.originationDate ? acc : cur.originationDate
    }
    return acc
  }, '')

  const truncatedPoolStates = poolStates?.filter((poolState: DailyPoolState) => {
    if (firstOriginationDate) {
      return new Date(poolState.timestamp) >= new Date(firstOriginationDate)
    }
    return true
  })

  const [range, setRange] = React.useState<(typeof rangeFilters)[number]>(rangeFilters[0])
  const rangeNumber = getRangeNumber(range.value, poolAge) ?? 100

  // querying chain for more accurate data, since data for today from subquery is not necessarily up to date
  const todayAssetValue = pool?.nav.total.toDecimal().toNumber() || 0
  const todayPrice = pool?.tranches
    ? formatBalance(pool?.tranches[pool.tranches.length - 1].tokenPrice || 0, undefined, 5, 5)
    : null

  const todayJuniorApy = getYieldFieldForFilter(
    pool?.tranches?.find((pool) => pool.seniority === 0),
    range.value
  )
    ?.toPercent()
    .toNumber()

  const todaySeniorApy = getYieldFieldForFilter(
    pool?.tranches?.find((pool) => pool.seniority === 1),
    range.value
  )
    ?.toPercent()
    .toNumber()

  const trancheTodayPrice = calculateTranchePrices(pool as Pool)

  // The nav broke on May 28th, so we need to hardcode some data for that day
  const adjustedPoolStates =
    pool.id === '4139607887'
      ? truncatedPoolStates?.flatMap((day, i, arr) => {
          const d = new Date(day.timestamp)
          const isMay28 = d.getFullYear() === 2025 && d.getMonth() === 4 && d.getDate() === 28

          if (isMay28 && i > 0) {
            const prev = arr[i - 1]
            return [
              {
                ...prev,
                timestamp: day.timestamp,
              },
            ]
          }

          return [day]
        })
      : truncatedPoolStates ?? []

  const data: ChartData[] = React.useMemo(
    () =>
      adjustedPoolStates?.map((day) => {
        const nav = day.poolState.netAssetValue.toDecimal().toNumber()

        const trancheKeys = Object.keys(day.tranches)
        const juniorTrancheKey = trancheKeys[0]
        const seniorTrancheKey = trancheKeys[1] || null

        const juniorTokenPrice = day.tranches[juniorTrancheKey]?.price?.toFloat() ?? 0
        const seniorTokenPrice = seniorTrancheKey ? day.tranches[seniorTrancheKey]?.price?.toFloat() ?? null : null

        const juniorAPY = getYieldFieldForFilter(day.tranches[juniorTrancheKey], range.value)
        const formattedJuniorAPY = juniorAPY.toPercent().toNumber()
        const seniorAPY = seniorTrancheKey ? getYieldFieldForFilter(day.tranches[seniorTrancheKey], range.value) : null
        const formattedSeniorAPY = seniorAPY?.toPercent().toNumber()

        if (day.timestamp && new Date(day.timestamp).toDateString() === new Date().toDateString()) {
          const tranchePrices = calculateTranchePrices(pool as Pool)

          return {
            day: new Date(day.timestamp),
            nav: todayAssetValue,
            juniorTokenPrice: tranchePrices.juniorTokenPrice ?? 0,
            seniorTokenPrice: tranchePrices.seniorTokenPrice ?? null,
            juniorAPY: todayJuniorApy,
            seniorAPY: todaySeniorApy,
          }
        }

        return {
          day: new Date(day.timestamp),
          nav: Number(nav),
          juniorTokenPrice: juniorTokenPrice !== 0 ? juniorTokenPrice : null,
          seniorTokenPrice: seniorTokenPrice !== 0 ? seniorTokenPrice : null,
          juniorAPY: formattedJuniorAPY,
          seniorAPY: formattedSeniorAPY,
        }
      }) || [],
    [truncatedPoolStates, todayAssetValue, pool, range, todayJuniorApy, todaySeniorApy]
  )

  const today = {
    nav: todayAssetValue,
    price: todayPrice,
    currency: pool.currency.symbol,
    juniorAPY: todayJuniorApy,
    seniorAPY: todaySeniorApy,
    ...trancheTodayPrice,
  }

  const chartData = data.slice(-rangeNumber)

  if (truncatedPoolStates && truncatedPoolStates?.length < 1 && poolAge > 0)
    return <Text variant="body2">No data available</Text>

  return (
    <Stack gap={2} padding={20}>
      <Stack flexDirection="row" justifyContent="space-between" alignItems="center" mb={12}>
        <Text variant="body2" fontWeight="500">
          Pool performance
        </Text>
        {showAPYGraph && (
          <Tabs selectedIndex={selectedTabIndex} onChange={(index) => setSelectedTabIndex(index)}>
            <TabsItem styleOverrides={{ padding: '8px' }} showBorder variant="secondary">
              Price
            </TabsItem>
            <TabsItem styleOverrides={{ padding: '8px' }} showBorder variant="secondary">
              APY
            </TabsItem>
          </Tabs>
        )}
      </Stack>
      <CustomLegend selectedTabIndex={selectedTabIndex} data={today} setRange={setRange} />
      <Shelf gap={4} width="100%" color="textSecondary" mt={4}>
        {chartData?.length ? (
          <ResponsiveContainer width="100%" height={280} minHeight={280} maxHeight={280}>
            <ComposedChart data={chartData} margin={{ left: -36 }}>
              <defs>
                <linearGradient id="colorPoolValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                dy={4}
                interval={0}
                minTickGap={100000}
                tickLine={false}
                type="category"
                tick={(props) => <CustomTick {...props} y={270} />}
                ticks={getOneDayPerMonth(chartData, 'day')}
              />
              <YAxis
                stroke="none"
                tickLine={false}
                style={{ fontSize: '10px', fill: theme.colors.textSecondary }}
                tickFormatter={(tick: number) => formatBalanceAbbreviated(tick, '', 0)}
                yAxisId="left"
                width={80}
              />
              <YAxis
                stroke="none"
                tickLine={false}
                style={{ fontSize: '10px', fill: theme.colors.textSecondary }}
                tickFormatter={(tick: number) => formatBalanceAbbreviated(tick, '', 2)}
                yAxisId="right"
                orientation="right"
                domain={selectedTabIndex === 0 ? ['auto', 'auto'] : ['dataMin', 'dataMax']}
              />
              <CartesianGrid stroke={theme.colors.borderPrimary} vertical={false} />
              <Tooltip
                content={({ payload }) => {
                  if (payload && payload?.length > 0) {
                    return (
                      <TooltipContainer>
                        <TooltipTitle>{formatDate(payload[0].payload.day)}</TooltipTitle>
                        {payload.map(({ name, value }, index) => {
                          const hasSeniorTranche = payload.length >= 3

                          const labelMap: Record<string, string> = {
                            nav: 'NAV',
                            juniorTokenPrice: hasSeniorTranche ? 'Junior Token Price' : 'Token Price',
                            seniorTokenPrice: 'Senior Token Price',
                            juniorAPY: hasSeniorTranche ? 'Junior APY' : 'APY',
                            seniorAPY: 'Senior APY',
                            default: 'Cash',
                          }

                          const label = typeof name === 'string' ? labelMap[name] ?? labelMap.default : labelMap.default

                          const formattedValue = (() => {
                            if (typeof value === 'undefined' || Array.isArray(value)) {
                              return '-'
                            }

                            if (name === 'juniorAPY' || name === 'seniorAPY') {
                              return formatPercentage(value)
                            }

                            return formatBalance(
                              Number(value),
                              name === 'nav' ? pool.currency.symbol ?? 'USD' : '',
                              name === 'juniorTokenPrice' || name === 'seniorTokenPrice' ? 6 : 0
                            )
                          })()

                          return (
                            <Shelf justifyContent="space-between" pl="4px" key={index}>
                              <Text color="textPrimary" variant="label2">
                                {label}
                              </Text>
                              <Text color="textPrimary" variant="label2">
                                {formattedValue}
                              </Text>
                            </Shelf>
                          )
                        })}
                      </TooltipContainer>
                    )
                  }
                  return null
                }}
              />
              <Bar
                type="monotone"
                dataKey="nav"
                strokeWidth={0}
                fillOpacity={1}
                fill={theme.colors.backgroundTertiary}
                yAxisId="left"
              />
              <Line
                type="monotone"
                dataKey="juniorTokenPrice"
                stroke={theme.colors.textGold}
                strokeWidth={2}
                dot={false}
                yAxisId="right"
                name="juniorTokenPrice"
                hide={selectedTabIndex === 1}
              />
              {chartData.some((d) => d.seniorTokenPrice !== null) && (
                <Line
                  type="monotone"
                  dataKey="seniorTokenPrice"
                  stroke={theme.colors.backgroundInverted}
                  strokeWidth={2}
                  dot={false}
                  yAxisId="right"
                  name="seniorTokenPrice"
                  hide={selectedTabIndex === 1}
                />
              )}
              <Line
                type="monotone"
                dataKey="juniorAPY"
                stroke={theme.colors.textGold}
                strokeWidth={2}
                dot={false}
                yAxisId="right"
                name="juniorAPY"
                hide={selectedTabIndex === 0}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="seniorAPY"
                stroke={theme.colors.backgroundInverted}
                strokeWidth={2}
                dot={false}
                yAxisId="right"
                name="seniorAPY"
                hide={selectedTabIndex === 0}
              />
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
  setRange,
  selectedTabIndex,
}: {
  data: {
    currency: string
    nav: number
    juniorTokenPrice: number
    seniorTokenPrice?: number | null
    juniorAPY: number | undefined | null
    seniorAPY: number | undefined | null
  }
  setRange: (value: { value: string; label: string }) => void
  selectedTabIndex: number
}) {
  const Dot = ({ color }: { color: string }) => (
    <Box width="8px" height="8px" borderRadius="50%" backgroundColor={color} marginRight="4px" />
  )

  const navData = {
    color: 'backgroundTertiary',
    label: `NAV ${data.currency}`,
    value: formatBalance(data.nav),
    type: 'nav',
    show: true,
  }

  const tokenData = [
    navData,
    {
      color: 'textGold',
      label: data.seniorTokenPrice ? 'Junior token price' : 'Token price',
      value: formatBalance(data.juniorTokenPrice ?? 0, '', 3),
      type: 'singleTrancheTokenPrice',
      show: true,
    },
    {
      color: 'textPrimary',
      label: 'Senior token price',
      value: formatBalance(data.seniorTokenPrice ?? 0, '', 3),
      type: 'singleTrancheTokenPrice',
      show: !!data.seniorTokenPrice,
    },
  ]

  const apyData = [
    navData,
    {
      color: 'textGold',
      label: data.seniorAPY ? 'Junior APY' : 'APY',
      value: formatPercentage(data.juniorAPY ?? 0),
      show: !!data.juniorAPY,
    },
    {
      color: 'textPrimary',
      label: 'Senior APY',
      value: formatPercentage(data.seniorAPY ?? 0),
      show: !!data.seniorAPY,
    },
  ]

  const graphData = selectedTabIndex === 0 ? tokenData : apyData

  const toggleRange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    const range = rangeFilters.find((range) => range.value === value)
    setRange(range ?? rangeFilters[0])
  }

  return (
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Box display="flex" justifyContent="space-evenly">
        {graphData.map((item: GraphDataItem, index: number) => {
          if (!item.show) return null

          const hasType = (item: GraphDataItem): item is GraphDataItemWithType => {
            return (item as GraphDataItemWithType).type !== undefined
          }

          return (
            <Stack key={index} display="flex" marginRight="20px">
              <Box display="flex" alignItems="center">
                <Dot color={item.color} />
                {hasType(item) ? (
                  <Text variant="body3" style={{ lineHeight: 1.8 }}>
                    <Tooltips type={item.type} label={item.label} color="textSecondary" size="sm" />
                  </Text>
                ) : (
                  <Text color="textSecondary" variant="body3" style={{ lineHeight: 1.8 }}>
                    {item.label}
                  </Text>
                )}
              </Box>
              <Text variant="heading1">{item.value}</Text>
            </Stack>
          )
        })}
      </Box>
      {/* <Box>
        <Select options={rangeFilters} onChange={toggleRange} hideBorder disabled />
      </Box> */}
    </Box>
  )
}

export const CustomTick = ({ x, y, payload, filterValue }: CustomTickProps) => {
  const theme = useTheme()

  let dateValue: Date | null = null
  if (payload.value instanceof Date) {
    dateValue = payload.value
  } else {
    dateValue = new Date(payload?.value as string)
  }

  const dateFormat: Intl.DateTimeFormatOptions =
    typeof filterValue !== 'undefined' && filterValue <= 90
      ? {
          month: 'short' as const,
          day: 'numeric' as const,
          timeZone: typeof payload.value === 'string' ? 'UTC' : undefined,
        }
      : { month: 'short' as const, timeZone: typeof payload.value === 'string' ? 'UTC' : undefined }

  return (
    <g transform={`translate(${x},${y})`}>
      <text style={{ fontSize: '10px', fill: theme.colors.textSecondary, letterSpacing: '-0.5px' }} textAnchor="middle">
        {dateValue ? dateValue.toLocaleString('en-US', dateFormat) : ''}
      </text>
    </g>
  )
}

export default PoolPerformanceChart
