import { Box, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import styled, { useTheme } from 'styled-components'
import { formatDate } from '../../utils/date'
import { formatBalance, formatBalanceAbbreviated } from '../../utils/formatting'
import { useAssetSnapshots } from '../../utils/usePools'
import { TooltipContainer, TooltipTitle } from './Tooltip'
import { getRangeNumber } from './utils'

type ChartData = {
  day: Date
  presentValue: number
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

interface Props {
  poolId: string
  loanId: string
}

function AssetPerformanceChart({ poolId, loanId }: Props) {
  const theme = useTheme()
  const chartColor = theme.colors.accentPrimary
  const assetSnapshots = useAssetSnapshots(poolId, loanId)

  const [range, setRange] = React.useState<(typeof rangeFilters)[number]>({ value: 'all', label: 'All' })
  const rangeNumber = getRangeNumber(range.value, 0) ?? 100

  const data: ChartData[] = React.useMemo(
    () =>
      assetSnapshots?.map((day) => {
        const presentValue = day.presentValue?.toDecimal().toNumber() || 0

        return { day: new Date(day.timestamp), presentValue }
      }) || [],
    [assetSnapshots]
  )

  if (assetSnapshots && assetSnapshots?.length < 1) return <Text variant="body2">No data available</Text>

  const chartData = data.slice(-rangeNumber)

  const today = {
    presentValue: 0,
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
              <CartesianGrid stroke={theme.colors.borderPrimary} vertical={false} />
              <Tooltip
                content={({ payload }) => {
                  if (payload && payload?.length > 0) {
                    return (
                      <TooltipContainer>
                        <TooltipTitle>{formatDate(payload[0].payload.day)}</TooltipTitle>
                        {payload.map(({ value }, index) => (
                          <Shelf justifyContent="space-between" pl="4px" key={index}>
                            <Text variant="label2">Value</Text>
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
              <Area
                type="monotone"
                dataKey="presentValue"
                strokeWidth={0}
                fillOpacity={1}
                fill="url(#colorPoolValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <Text variant="label1">No data yet</Text>
        )}
      </Shelf>
    </Stack>
  )
}

export default AssetPerformanceChart
