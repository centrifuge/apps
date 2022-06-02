import { Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import React from 'react'
import { useParams } from 'react-router'
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTheme } from 'styled-components'
import { formatBalance, formatBalanceAbbreviated } from '../../utils/formatting'
import { useDailyPoolStates, usePool } from '../../utils/usePools'
import { Tooltips } from '../Tooltips'
import { CustomizedTooltip, CustomizedXAxisTick } from './CustomChartElements'

type ChartData = {
  day: Date
  poolValue: number
  assetValue: number
  reserve: [number, number]
}

const PoolAssetReserveChart: React.VFC = () => {
  const theme = useTheme()
  const { pid: poolId } = useParams<{ pid: string }>()
  const poolStates = useDailyPoolStates(poolId)
  const pool = usePool(poolId)

  const data: ChartData[] = React.useMemo(() => {
    return (
      poolStates?.map((day) => {
        const assetValue = day.poolState.netAssetValue.toDecimal().toNumber()
        const poolValue = day.poolValue.toDecimal().toNumber()
        return { day: new Date(day.timestamp), poolValue, assetValue, reserve: [assetValue, poolValue] }
      }) || []
    )
  }, [poolStates])

  const todayPoolValue = pool?.value.toDecimal().toNumber() || 0
  const todayAssetValue = pool?.nav.latest.toDecimal().toNumber() || 0
  const today: ChartData = {
    day: new Date(),
    poolValue: todayPoolValue,
    assetValue: todayAssetValue,
    reserve: [todayAssetValue, todayPoolValue],
  }

  const chartData = [...data, today]

  return (
    <Stack>
      <CustomLegend data={today} currency={pool?.currency || ''} />
      <Shelf gap="4" width="100%" color="textSecondary">
        {chartData?.length ? (
          <ResponsiveContainer width="100%" height="100%" minHeight="200px">
            <ComposedChart data={chartData} margin={{ left: -20, right: 10 }} reverseStackOrder>
              <XAxis
                dataKey="day"
                tick={<CustomizedXAxisTick variant={chartData.length > 30 ? 'months' : 'days'} />}
                tickLine={false}
                interval={chartData.length < 18 || chartData.length > 30 ? 0 : 1}
              />
              <YAxis
                tickLine={false}
                style={{ fontSize: '10px', fontFamily: "'Inter'" }}
                tickFormatter={(tick: number) => formatBalanceAbbreviated(tick, '', 0)}
              />
              <CartesianGrid stroke={theme.colors.borderSecondary} />
              <Tooltip content={<CustomizedTooltip currency={pool?.currency || ''} />} />
              <Area
                fill={theme.colors.backgroundSecondary}
                dataKey="reserve"
                stroke="transparent"
                strokeOpacity={0}
                fillOpacity={0.8}
                name="Reserve"
              />
              <Line dot={false} dataKey="assetValue" stroke={theme.colors.accentSecondary} name="Asset value" />
              <Line dot={false} dataKey="poolValue" stroke={theme.colors.accentPrimary} name="Pool value" />
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
          <Tooltips variant="secondary" type="poolValue" />
          <Text variant="body2">{formatBalance(data.poolValue, currency)}</Text>
        </Stack>
        <Stack borderLeftWidth="3px" pl="4px" borderLeftStyle="solid" borderLeftColor={theme.colors.accentSecondary}>
          <Tooltips variant="secondary" type="assetValue" />
          <Text variant="body2">{formatBalance(data.assetValue, currency)}</Text>
        </Stack>
        <Stack borderLeftWidth="3px" pl="4px" borderLeftStyle="solid" borderLeftColor={theme.colors.borderSecondary}>
          <Tooltips variant="secondary" type="poolReserve" />
          <Text variant="body2">{formatBalance(data.reserve[1] - data.reserve[0], currency)}</Text>
        </Stack>
      </Grid>
    </Shelf>
  )
}

export { PoolAssetReserveChart as default }
