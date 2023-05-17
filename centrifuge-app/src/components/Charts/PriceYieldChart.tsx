import { Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTheme } from 'styled-components'
import { formatBalance } from '../../utils/formatting'
import { useDailyTrancheStates, usePool } from '../../utils/usePools'
import { Spinner } from '../Spinner'
import { CustomizedTooltip, CustomizedXAxisTick } from './CustomChartElements'

type ChartData = {
  day: Date
  tokenPrice: number
}

const PriceYieldChart: React.FC<{
  trancheId: string
  onDataLoaded?: (b: boolean) => void
  renderFallback?: boolean
}> = ({ trancheId, onDataLoaded = () => {}, renderFallback = true }) => {
  const theme = useTheme()
  const { pid: poolId } = useParams<{ pid: string }>()
  const trancheStates = useDailyTrancheStates(trancheId)
  const pool = usePool(poolId)

  const data: ChartData[] = React.useMemo(() => {
    return (
      trancheStates?.map((day) => {
        return {
          day: new Date(day.timestamp),
          tokenPrice: day.tokenPrice.toDecimal().toNumber(),
        }
      }) || []
    )
  }, [trancheStates])

  React.useEffect(() => {
    onDataLoaded(data.length > 0)
  }, [])

  if (!trancheStates || trancheStates?.length === 1) return <Spinner />

  return data && data.length > 0 ? (
    <Stack>
      <CustomLegend data={data[data.length - 1]} poolId={poolId} />
      <Shelf gap="4" width="100%" color="textSecondary">
        <ResponsiveContainer width="100%" height="100%" minHeight="200px">
          <ComposedChart data={data} margin={{ left: -30, top: 2 }} reverseStackOrder>
            <XAxis
              dataKey="day"
              tick={<CustomizedXAxisTick variant={data.length > 30 ? 'months' : 'days'} />}
              tickLine={false}
              interval={data.length < 18 || data.length > 30 ? 0 : 1}
            />
            <YAxis
              tickLine={false}
              style={{ fontSize: '10px', fill: theme.colors.textSecondary }}
              tickFormatter={(tick: number) => {
                return tick.toFixed(2)
              }}
              domain={['dataMin - 0.2', 'dataMax + 0.2']}
            />
            <CartesianGrid stroke={theme.colors.borderSecondary} />
            <Tooltip content={<CustomizedTooltip currency={pool?.currency.symbol || ''} precision={4} />} />
            <Line dot={false} dataKey="tokenPrice" stroke={theme.colors.accentPrimary} name="Pool value" />
          </ComposedChart>
        </ResponsiveContainer>
      </Shelf>
    </Stack>
  ) : renderFallback ? (
    <Text variant="label1">Data unavailable</Text>
  ) : null
}

const CustomLegend: React.VFC<{
  data: ChartData
  poolId: string
}> = ({ data, poolId }) => {
  const theme = useTheme()
  const pool = usePool(poolId)

  return (
    <Shelf bg="backgroundSecondary" width="100%" gap="2">
      <Grid pl="4" pb="4" columns={6} gap="3" width="100%">
        <Stack borderLeftWidth="3px" pl="4px" borderLeftStyle="solid" borderLeftColor={theme.colors.accentPrimary}>
          <Text variant="label2">Token price</Text>
          <Text variant="body2">{formatBalance(data.tokenPrice, pool?.currency.symbol, 4)}</Text>
        </Stack>
      </Grid>
    </Shelf>
  )
}

export default PriceYieldChart
