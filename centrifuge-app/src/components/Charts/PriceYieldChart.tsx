import { Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import React from 'react'
import { useParams } from 'react-router'
import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTheme } from 'styled-components'
import { formatBalance } from '../../utils/formatting'
import { useDailyTrancheStates, usePool } from '../../utils/usePools'
import { CustomizedTooltip, CustomizedXAxisTick } from './CustomChartElements'

type ChartData = {
  day: Date
  tokenPrice: number
}

const PriceYieldChart: React.VFC = () => {
  const theme = useTheme()
  const { pid: poolId } = useParams<{ pid: string }>()
  const trancheStates = useDailyTrancheStates(poolId, '0xe881f34c28a53f3886d6d03eb30ba05b')
  const pool = usePool(poolId)

  const data: ChartData[] = React.useMemo(() => {
    return (
      trancheStates?.map((day) => {
        return {
          day: new Date(day.timestamp),
          tokenPrice: day.price.toDecimal().toNumber(),
        }
      }) || []
    )
  }, [trancheStates])

  if (trancheStates && trancheStates?.length < 1) return <Text variant="body2">No data available</Text>

  const today: ChartData = {
    day: new Date(),
    tokenPrice:
      pool?.tranches
        .find((tranche) => tranche.id === '0xe881f34c28a53f3886d6d03eb30ba05b')
        ?.tokenPrice?.toDecimal()
        .toNumber() || 1,
  }

  const chartData = [...data, today]

  return (
    <Stack>
      <CustomLegend data={today} />
      <Shelf gap="4" width="100%" color="textSecondary">
        {chartData?.length ? (
          <ResponsiveContainer width="100%" height="100%" minHeight="200px">
            <ComposedChart data={chartData} margin={{ left: -30, top: 2 }} reverseStackOrder>
              <XAxis
                dataKey="day"
                tick={<CustomizedXAxisTick variant={chartData.length > 30 ? 'months' : 'days'} />}
                tickLine={false}
                interval={chartData.length < 18 || chartData.length > 30 ? 0 : 1}
              />
              <YAxis
                tickLine={false}
                style={{ fontSize: '10px', fill: theme.colors.textSecondary }}
                tickFormatter={(tick: number) => {
                  return tick.toFixed(2)
                }}
              />
              <CartesianGrid stroke={theme.colors.borderSecondary} />
              <Tooltip content={<CustomizedTooltip currency={pool?.currency || ''} />} />
              <Line dot={false} dataKey="tokenPrice" stroke={theme.colors.accentPrimary} name="Pool value" />
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
  data: ChartData
}> = ({ data }) => {
  const theme = useTheme()

  return (
    <Shelf bg="backgroundSecondary" width="100%" gap="2">
      <Grid pl="4" pb="4" columns={6} gap="3" width="100%">
        <Stack borderLeftWidth="3px" pl="4px" borderLeftStyle="solid" borderLeftColor={theme.colors.accentPrimary}>
          <Text variant="label2">Token price</Text>
          <Text variant="body2">{formatBalance(data.tokenPrice, undefined, 2)}</Text>
        </Stack>
      </Grid>
    </Shelf>
  )
}

export default PriceYieldChart
