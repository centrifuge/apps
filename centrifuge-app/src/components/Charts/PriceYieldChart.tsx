import { Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTheme } from 'styled-components'
import { formatBalance } from '../../utils/formatting'
import { useDailyPoolStates, usePool } from '../../utils/usePools'
import { Spinner } from '../Spinner'
import { CustomizedTooltip } from './Tooltip'

type ChartData = {
  day: Date
  tokenPrice: number
}

function PriceYieldChart({
  trancheId,
  onDataLoaded = () => {},
  renderFallback = true,
}: {
  trancheId: string
  poolId: string
  onDataLoaded?: (b: boolean) => void
  renderFallback?: boolean
}) {
  const theme = useTheme()
  const { pid: poolId } = useParams<{ pid: string }>()

  if (!poolId) throw new Error('Pool not found')

  const { trancheStates: tranches } = useDailyPoolStates(poolId, undefined, undefined) || {}
  const trancheStates = tranches?.[trancheId]
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

  React.useLayoutEffect(() => {
    onDataLoaded(data.length > 0)
  }, [data, onDataLoaded])

  if (!tranches && !poolId.startsWith('0x')) return <Spinner />

  return data && data.length > 0 ? (
    <Stack>
      <CustomLegend data={data[data.length - 1]} poolId={poolId} />
      <Shelf gap="4" width="100%" color="textSecondary">
        <ResponsiveContainer width="100%" height="100%" minHeight="200px">
          <ComposedChart data={data} margin={{ left: -30, top: 2 }} reverseStackOrder>
            <XAxis
              dataKey="day"
              type="category"
              tickFormatter={(tick: number) => {
                if (data.length > 180) {
                  return new Date(tick).toLocaleString('en-US', { month: 'short' })
                }
                return new Date(tick).toLocaleString('en-US', { day: 'numeric', month: 'short' })
              }}
              style={{ fontSize: '10px', fill: theme.colors.textSecondary, letterSpacing: '-0.5px' }}
              tickLine={false}
              allowDuplicatedCategory={false}
            />
            <YAxis
              tickLine={false}
              style={{ fontSize: '10px', fill: theme.colors.textSecondary }}
              tickFormatter={(tick: number) => {
                return tick.toFixed(2)
              }}
              domain={['dataMin - 0.2', 'dataMax + 0.2']}
            />
            <CartesianGrid stroke={theme.colors.borderPrimary} />
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

function CustomLegend({ data, poolId }: { data: ChartData; poolId: string }) {
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
