import { Box, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTheme } from 'styled-components'
import { formatBalanceAbbreviated, formatPercentage } from '../../utils/formatting'
import { useDailyPoolStates, usePool } from '../../utils/usePools'
import { Tooltips } from '../Tooltips'
import { CustomizedTooltip } from './Tooltip'

type ChartData = {
  day: Date
  cashDrag: number
}

export default function CashDragChart() {
  const theme = useTheme()
  const { pid: poolId } = useParams<{ pid: string }>()
  const { poolStates } = useDailyPoolStates(poolId) || {}
  const pool = usePool(poolId)

  if (!poolStates || poolStates?.length < 1) return <Text variant="body2">No data available</Text>

  const data: ChartData[] =
    poolStates?.map((day) => {
      const assetValue = day.poolState.portfolioValuation.toDecimal().toNumber()
      const reserve = day.poolState.totalReserve.toDecimal().toNumber()
      const cashDrag = (reserve / (reserve + assetValue)) * 100
      return { day: new Date(day.timestamp), cashDrag: cashDrag || 0 }
    }) || []

  // querying chain for more accurate data, since data for today from subquery is not necessarily up to date
  const todayAssetValue = pool?.nav.latest.toDecimal().toNumber() || 0
  const todayReserve = pool?.reserve.total.toDecimal().toNumber() || 0
  const cashDrag = (todayReserve / (todayAssetValue + todayReserve)) * 100
  const today: ChartData = {
    day: new Date(),
    cashDrag: cashDrag || 0,
  }

  const chartData = [...data.slice(0, data.length - 1), today]

  return (
    <Stack>
      <CustomLegend data={today} currency={pool?.currency.symbol || ''} />
      <Shelf gap="4" width="100%" color="textSecondary">
        {chartData?.length ? (
          <ResponsiveContainer width="100%" height="100%" minHeight="200px">
            <ComposedChart data={chartData} margin={{ left: -16 }}>
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
              />
              <YAxis
                yAxisId="left"
                tickLine={false}
                style={{ fontSize: '10px', fill: theme.colors.textSecondary }}
                tickFormatter={(tick: number) => formatBalanceAbbreviated(tick, '', 0)}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                style={{ fontSize: '10px', fill: theme.colors.textSecondary }}
                tickMargin={5}
                tickLine={false}
                tickFormatter={(tick: number) => `${tick}%`}
              />
              <CartesianGrid stroke={theme.colors.borderSecondary} />
              <Tooltip content={<CustomizedTooltip currency={pool?.currency.symbol || ''} />} />
              <Line
                dot={false}
                dataKey="cashDrag"
                yAxisId="right"
                stroke={theme.colors.accentSecondary}
                unit="percent"
                name="Cash drag"
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

function CustomLegend({ data, currency }: { currency: string; data: ChartData }) {
  const theme = useTheme()

  return (
    <Box bg="backgroundPage" pl="5" pb="4">
      <Stack borderLeftWidth="3px" pl="4px" borderLeftStyle="solid" borderLeftColor={theme.colors.accentSecondary}>
        <Tooltips variant="secondary" type="cashDrag" />
        <Text variant="body2">{formatPercentage(data.cashDrag)}</Text>
      </Stack>
    </Box>
  )
}
