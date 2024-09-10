import { AnchorButton, Box, IconDownload, Select, Shelf, Stack, Tabs, TabsItem, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import * as React from 'react'
import { useParams } from 'react-router'
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTheme } from 'styled-components'
import { getCSVDownloadUrl } from '../../../src/utils/getCSVDownloadUrl'
import { daysBetween, formatDate } from '../../utils/date'
import { formatBalance, formatBalanceAbbreviated, formatPercentage } from '../../utils/formatting'
import { useLoans } from '../../utils/useLoans'
import { useDailyPoolStates, usePool } from '../../utils/usePools'
import { Tooltips } from '../Tooltips'
import { TooltipContainer, TooltipTitle } from './Tooltip'
import { getRangeNumber } from './utils'

type ChartData = {
  day: Date
  nav: number
  juniorTokenPrice: number | null
  seniorTokenPrice?: number | null
  currency?: string
  seniorAPY: Decimal | null
  juniorAPY: Decimal
  isToday: boolean
}

type Tranche = {
  seniority: number
  tokenPrice: number
}

const rangeFilters = [
  { value: 'all', label: 'All' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'ytd', label: 'Year to date' },
]

function calculateTranchePrices(pool: any) {
  if (!pool?.tranches) return { juniorPrice: null, seniorPrice: null }

  const juniorTranche = pool.tranches.find((t: Tranche) => t.seniority === 0)
  const seniorTranche = pool.tranches.length > 1 ? pool.tranches.find((t: Tranche) => t.seniority === 1) : null

  const juniorTokenPrice = juniorTranche ? Number(formatBalance(juniorTranche.tokenPrice, undefined, 5, 5)) : null
  const seniorTokenPrice = seniorTranche ? Number(formatBalance(seniorTranche.tokenPrice, undefined, 5, 5)) : null

  return { juniorTokenPrice, seniorTokenPrice }
}

function getYieldFieldForFilter(tranche: any, filter: string) {
  switch (filter) {
    case '30d':
      return tranche.yield30DaysAnnualized || 0
    case '90d':
      return tranche.yield90DaysAnnualized || 0
    case 'ytd':
      return tranche.yieldYTD || 0
    case 'all':
      return tranche.yieldSinceInception || 0
    default:
      return 0
  }
}

function PoolPerformanceChart() {
  const theme = useTheme()
  const [selectedTabIndex, setSelectedTabIndex] = React.useState(0)
  const chartColor = theme.colors.textGold
  const { pid: poolId } = useParams<{ pid: string }>()

  if (!poolId) throw new Error('Pool not found')

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

  const isSingleTranche = pool?.tranches.length === 1

  // querying chain for more accurate data, since data for today from subquery is not necessarily up to date
  const todayAssetValue = pool?.nav.total.toDecimal().toNumber() || 0
  const todayPrice = pool?.tranches
    ? formatBalance(pool?.tranches[pool.tranches.length - 1].tokenPrice || 0, undefined, 5, 5)
    : null

  const trancheTodayPrice = calculateTranchePrices(pool)

  const data: ChartData[] = React.useMemo(
    () =>
      truncatedPoolStates?.map((day: any) => {
        const nav = day.poolState.netAssetValue.toDecimal().toNumber()

        const trancheKeys = Object.keys(day.tranches)
        const juniorTrancheKey = trancheKeys[0]
        const seniorTrancheKey = trancheKeys[1] || null

        const juniorTokenPrice = day.tranches[juniorTrancheKey]?.price?.toFloat() ?? null
        const seniorTokenPrice = seniorTrancheKey ? day.tranches[seniorTrancheKey]?.price?.toFloat() ?? null : null

        const juniorAPY = getYieldFieldForFilter(day.tranches[juniorTrancheKey], range.value).toPercent().toNumber()
        const seniorAPY = seniorTrancheKey
          ? getYieldFieldForFilter(day.tranches[seniorTrancheKey], range.value).toPercent().toNumber()
          : null

        if (day.timestamp && new Date(day.timestamp).toDateString() === new Date().toDateString()) {
          const tranchePrices = calculateTranchePrices(pool)

          return {
            day: new Date(day.timestamp),
            nav: todayAssetValue,
            juniorTokenPrice: tranchePrices.juniorTokenPrice ?? null,
            seniorTokenPrice: tranchePrices.seniorTokenPrice ?? null,
            juniorAPY,
            seniorAPY,
            isToday: true,
          }
        }

        return {
          day: new Date(day.timestamp),
          nav: Number(nav),
          juniorTokenPrice: juniorTokenPrice !== 0 ? juniorTokenPrice : null,
          seniorTokenPrice: seniorTokenPrice !== 0 ? seniorTokenPrice : null,
          juniorAPY,
          seniorAPY,
          isToday: false,
        }
      }) || [],
    [isSingleTranche, truncatedPoolStates, todayAssetValue, todayPrice, pool, range]
  )

  const todayData = data.find((day) => day.isToday)

  const today = {
    nav: todayAssetValue,
    price: todayPrice,
    currency: pool.currency.symbol,
    juniorAPY: todayData?.juniorAPY,
    seniorAPY: todayData?.seniorAPY,
    ...trancheTodayPrice,
  }

  const chartData = data.slice(-rangeNumber)

  const dataUrl: any = React.useMemo(() => {
    if (!chartData || !chartData?.length) {
      return undefined
    }

    const filteredData = chartData.map((data) => {
      const base = {
        day: data.day,
        nav: data.nav,
        juniorTokenPrice: data.juniorTokenPrice,
        juniorAPY: data.juniorAPY,
      }
      if (data.seniorTokenPrice && data.seniorAPY) {
        return {
          ...base,
          seniorTokenPrice: data.seniorTokenPrice,
          seniorAPY: data.seniorAPY,
        }
      } else return { ...base }
    })

    return getCSVDownloadUrl(filteredData as any)
  }, [chartData, selectedTabIndex])

  const priceRange = React.useMemo(() => {
    if (!chartData) return [0, 100]

    const min =
      chartData.reduce((prev, curr) => {
        const currMin = Math.min(curr.juniorTokenPrice ?? Infinity, curr.seniorTokenPrice ?? Infinity)
        const prevMin = Math.min(prev.juniorTokenPrice ?? Infinity, prev.seniorTokenPrice ?? Infinity)
        return currMin < prevMin ? curr : prev
      }, chartData[0])?.juniorTokenPrice ?? 0

    const max =
      chartData.reduce((prev, curr) => {
        const currMax = Math.max(curr.juniorTokenPrice ?? -Infinity, curr.seniorTokenPrice ?? -Infinity)
        const prevMax = Math.max(prev.juniorTokenPrice ?? -Infinity, prev.seniorTokenPrice ?? -Infinity)
        return currMax > prevMax ? curr : prev
      }, chartData[0])?.juniorTokenPrice ?? 1

    return [min, max]
  }, [chartData])

  if (truncatedPoolStates && truncatedPoolStates?.length < 1 && poolAge > 0)
    return <Text variant="body2">No data available</Text>

  const getOneDayPerMonth = (): any[] => {
    const seenMonths = new Set<string>()
    const result: any[] = []

    chartData.forEach((item) => {
      const date = new Date(item.day)
      const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' })

      if (!seenMonths.has(monthYear)) {
        seenMonths.add(monthYear)
        result.push(item.day)
      }
    })

    return result
  }

  return (
    <Stack gap={2} padding={20}>
      <Stack flexDirection="row" justifyContent="space-between" alignItems="center" mb={12}>
        <Text variant="body2" fontWeight="500">
          Pool performance
        </Text>
        <Tabs selectedIndex={selectedTabIndex} onChange={(index) => setSelectedTabIndex(index)}>
          <TabsItem styleOverrides={{ padding: '8px' }} showBorder>
            Price
          </TabsItem>
          <TabsItem styleOverrides={{ padding: '8px' }} showBorder>
            APY
          </TabsItem>
        </Tabs>
        <AnchorButton
          download={`pool-${poolId}-timeseries.csv`}
          href={dataUrl}
          variant="inverted"
          icon={IconDownload}
          small
        >
          Download
        </AnchorButton>
      </Stack>
      <CustomLegend selectedTabIndex={selectedTabIndex} data={today} setRange={setRange} />
      <Shelf gap={4} width="100%" color="textSecondary" mt={4}>
        {chartData?.length ? (
          <ResponsiveContainer width="100%" height={200} minHeight={200} maxHeight={200}>
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
                tick={<CustomTick tickCount={getOneDayPerMonth().length} />}
                ticks={getOneDayPerMonth()}
              />
              <YAxis
                stroke="none"
                tickLine={false}
                style={{ fontSize: '10px', fill: theme.colors.textPrimary }}
                tickFormatter={(tick: number) => formatBalanceAbbreviated(tick, '', 0)}
                yAxisId="left"
                width={80}
              />
              <YAxis
                stroke="none"
                tickLine={false}
                style={{ fontSize: '10px', fill: theme.colors.textPrimary }}
                tickFormatter={(tick: number) => formatBalanceAbbreviated(tick, '', 6)}
                yAxisId="right"
                orientation="right"
                domain={priceRange}
                hide={true}
              />
              <CartesianGrid stroke={theme.colors.borderPrimary} vertical={false} />
              <Tooltip
                content={({ payload }) => {
                  if (payload && payload?.length > 0) {
                    return (
                      <TooltipContainer>
                        <TooltipTitle>{formatDate(payload[0].payload.day)}</TooltipTitle>
                        {payload.map(({ name, value }, index) => {
                          const labelMap: Record<string, string> = {
                            nav: 'NAV',
                            juniorTokenPrice: 'Junior Token Price',
                            seniorTokenPrice: 'Senior Token Price',
                            juniorAPY: 'Junior APY',
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
    juniorAPY: number
    seniorAPY: number
  }
  setRange: (value: { value: string; label: string }) => void
  selectedTabIndex: number
}) {
  const Dot = ({ color }: { color: string }) => (
    <Box width="8px" height="8px" borderRadius="50%" backgroundColor={color} marginRight="4px" />
  )

  const navObj = {
    color: 'backgroundTertiary',
    label: `NAV ${data.currency}`,
    value: formatBalance(data.nav),
    type: 'nav',
    show: true,
  }

  const tokenData = [
    navObj,
    {
      color: 'textGold',
      label: 'Junior token price',
      value: data.juniorTokenPrice ?? 0,
      type: 'singleTrancheTokenPrice',
      show: true,
    },
    {
      color: 'textPrimary',
      label: 'Senior token price',
      value: data.seniorTokenPrice ?? 0,
      type: 'singleTrancheTokenPrice',
      show: !!data.seniorTokenPrice,
    },
  ]

  const apyData = [
    navObj,
    {
      color: 'textGold',
      label: 'Junior APY',
      value: formatPercentage(data.juniorAPY ?? 0),
      type: 'singleTrancheTokenPrice',
      show: true,
    },
    {
      color: 'textPrimary',
      label: 'Senior APY',
      value: formatPercentage(data.seniorAPY ?? 0),
      type: 'singleTrancheTokenPrice',
      show: !!data.seniorAPY,
    },
  ]

  const graphData = selectedTabIndex === 0 ? tokenData : apyData

  const toggleRange = (e: any) => {
    const value = e.target.value
    const range = rangeFilters.find((range) => range.value === value)
    setRange(range ?? rangeFilters[0])
  }

  return (
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Box display="flex" justifyContent="space-evenly">
        {graphData.map((item: any, index: any) => {
          if (!item.show) return
          return (
            <Stack key={index} pl={1} display="flex" marginRight="20px">
              <Box display="flex" alignItems="center">
                <Dot color={item.color} />
                <Tooltips type={item.type} label={item.label} />
              </Box>
              <Text variant="heading1">{item.value}</Text>
            </Stack>
          )
        })}
      </Box>
      <Box>
        <Select options={rangeFilters} onChange={toggleRange} hideBorder />
      </Box>
    </Box>
  )
}

const CustomTick = ({ x, y, payload }: any) => {
  const theme = useTheme()
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        style={{ fontSize: '10px', fill: theme.colors.textPrimary, letterSpacing: '-0.5px' }}
        x={0}
        y={0}
        dy={16}
        textAnchor="middle"
      >
        {new Date(payload.value).toLocaleString('en-US', { month: 'short' })}
      </text>
    </g>
  )
}

export default PoolPerformanceChart
