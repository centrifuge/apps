import { Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import React from 'react'
import { useParams } from 'react-router'
import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTheme } from 'styled-components'
import { formatBalance, formatBalanceAbbreviated, formatPercentage } from '../../utils/formatting'
import { useDailyPoolStates, usePool } from '../../utils/usePools'
import { Tooltips } from '../Tooltips'
import { CustomizedTooltip, CustomizedXAxisTick } from './CustomChartElements'

type ChartData = {
  day: Date
  cashDrag: number
  reserve: number
}

export const ReserveCashDragChart: React.VFC = () => {
  const theme = useTheme()
  const { pid: poolId } = useParams<{ pid: string }>()
  const poolStates = useDailyPoolStates(poolId)
  const pool = usePool(poolId)

  const data: ChartData[] =
    poolStates?.map((day) => {
      const assetValue = day.poolState.netAssetValue.toDecimal().toNumber()
      const reserve = day.poolState.totalReserve.toDecimal().toNumber()
      const cashDrag = (reserve / (reserve + assetValue)) * 100
      return { day: new Date(day.timestamp), cashDrag: cashDrag || 0, reserve }
    }) || []

  const todayAssetValue = pool?.nav.latest.toDecimal().toNumber() || 0
  const todayReserve = pool?.reserve.total.toDecimal().toNumber() || 0
  const cashDrag = (todayReserve / (todayAssetValue + todayReserve)) * 100
  const today: ChartData = {
    day: new Date(),
    cashDrag: cashDrag || 0,
    reserve: todayReserve,
  }

  return (
    <Stack>
      <CustomLegend data={today} currency={pool?.currency || ''} />
      <Shelf gap="4" width="100%" color="textSecondary">
        {[...data, today]?.length ? (
          <ResponsiveContainer width="100%" height="100%" minHeight="200px">
            <ComposedChart data={[...data, today]} margin={{ left: -30 }}>
              <XAxis
                dataKey="day"
                tick={<CustomizedXAxisTick variant={[...data, today].length > 30 ? 'months' : 'days'} />}
                tickLine={false}
                interval={0}
              />
              <YAxis
                yAxisId="left"
                tickLine={false}
                style={{ fontSize: '10px', fontFamily: "'Inter'" }}
                tickFormatter={(tick: number) => formatBalanceAbbreviated(tick)}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                style={{ fontSize: '10px', fontFamily: "'Inter'" }}
                tickMargin={5}
                tickLine={false}
                tickFormatter={(tick: number) => `${tick}%`}
              />
              <CartesianGrid stroke={theme.colors.borderSecondary} />
              <Tooltip content={<CustomizedTooltip currency={pool?.currency || ''} />} />
              <Line dot={false} dataKey="reserve" yAxisId="left" stroke={theme.colors.accentPrimary} name="Reserve" />
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

const CustomLegend: React.VFC<{
  currency: string
  data: ChartData
}> = ({ data, currency }) => {
  const theme = useTheme()

  return (
    <Shelf bg="backgroundPage" width="100%" gap="2">
      <Grid pl="4" pb="4" columns={6} gap="3" width="100%">
        <Stack borderLeftWidth="3px" pl="4px" borderLeftStyle="solid" borderLeftColor={theme.colors.accentPrimary}>
          <Tooltips variant="secondary" type="poolReserve" />
          <Text variant="body2">{formatBalance(data.reserve, currency)}</Text>
        </Stack>
        <Stack borderLeftWidth="3px" pl="4px" borderLeftStyle="solid" borderLeftColor={theme.colors.accentSecondary}>
          <Tooltips variant="secondary" type="cashDrag" />
          <Text variant="body2">{formatPercentage(data.cashDrag)}</Text>
        </Stack>
      </Grid>
    </Shelf>
  )
}
