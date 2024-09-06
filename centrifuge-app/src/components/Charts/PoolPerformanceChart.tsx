import { AnchorButton, Box, Grid, IconDownload, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import styled, { useTheme } from 'styled-components'
import { getCSVDownloadUrl } from '../../../src/utils/getCSVDownloadUrl'
import { daysBetween, formatDate } from '../../utils/date'
import { formatBalance, formatBalanceAbbreviated } from '../../utils/formatting'
import { useLoans } from '../../utils/useLoans'
import { useDailyPoolStates, usePool } from '../../utils/usePools'
import { Tooltips } from '../Tooltips'
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

  const data: ChartData[] = React.useMemo(
    () =>
      truncatedPoolStates?.map((day) => {
        const nav = day.poolState.netAssetValue.toDecimal().toNumber()
        const price = (isSingleTranche && Object.values(day.tranches)[0].price?.toFloat()) || null
        if (day.timestamp && new Date(day.timestamp).toDateString() === new Date().toDateString()) {
          return { day: new Date(day.timestamp), nav: todayAssetValue, price: Number(todayPrice) }
        }
        return { day: new Date(day.timestamp), nav: Number(nav), price: Number(price) }
      }) || [],
    [isSingleTranche, truncatedPoolStates, todayAssetValue, todayPrice]
  )

  const today = {
    nav: todayAssetValue,
    price: todayPrice,
  }

  const chartData = data.slice(-rangeNumber)

  const dataUrl: any = React.useMemo(() => {
    if (!chartData || !chartData?.length) {
      return undefined
    }

    const filteredData = chartData.map((data) => ({
      day: data.day,
      tokenPrice: data.price,
    }))

    return getCSVDownloadUrl(filteredData as any)
  }, [chartData])

  const priceRange = React.useMemo(() => {
    if (!chartData) return [0, 100]

    const min =
      chartData?.reduce((prev, curr) => {
        return prev.price! < curr.price! ? prev : curr
      }, chartData[0])?.price || 0

    const max =
      chartData?.reduce((prev, curr) => {
        return prev.price! > curr.price! ? prev : curr
      }, chartData[0])?.price || 1
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
    <Stack gap={2}>
      <Stack flexDirection="row" justifyContent="space-between">
        <Text fontSize="18px" fontWeight="500">
          Pool performance
        </Text>
        <AnchorButton
          download={`pool-${poolId}-timeseries.csv`}
          href={dataUrl}
          variant="secondary"
          icon={IconDownload}
          small
        >
          Download
        </AnchorButton>
      </Stack>
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
                style={{ fontSize: '10px', fill: theme.colors.textSecondary }}
                tickFormatter={(tick: number) => formatBalanceAbbreviated(tick, '', 0)}
                yAxisId="left"
                width={80}
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
                            <Text variant="label2">
                              {name === 'nav' ? 'NAV' : name === 'price' ? 'Token price' : 'Cash'}
                            </Text>
                            <Text variant="label2">
                              {name === 'nav' && typeof value === 'number'
                                ? formatBalance(value, 'USD')
                                : typeof value === 'number'
                                ? formatBalance(value, 'USD', 6)
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
              <Bar type="monotone" dataKey="nav" strokeWidth={0} fillOpacity={1} fill="#dbe5ff" yAxisId="left" />
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
      <Grid pb={2} gridTemplateColumns="fit-content(100%) fit-content(100%) fit-content(100%)" width="100%" gap={8}>
        <Stack
          borderLeftWidth="3px"
          pl={1}
          borderLeftStyle="solid"
          borderLeftColor={theme.colors.accentPrimary}
          gap="4px"
        >
          <Tooltips type="nav" />
          <Text variant="body1">{formatBalance(data.nav, 'USD')}</Text>
        </Stack>
        {data.price && (
          <Stack borderLeftWidth="3px" pl={1} borderLeftStyle="solid" borderLeftColor="#FFC012" gap="4px">
            <Tooltips type="singleTrancheTokenPrice" />
            <Text variant="body1">{data.price ? formatBalance(data.price, 'USD', 6) : '-'}</Text>
          </Stack>
        )}
      </Grid>
    </Shelf>
  )
}

const CustomTick = ({ x, y, payload }: any) => {
  const theme = useTheme()
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        style={{ fontSize: '10px', fill: theme.colors.textSecondary, letterSpacing: '-0.5px' }}
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
