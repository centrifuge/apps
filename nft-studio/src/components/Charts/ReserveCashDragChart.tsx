import { Box, Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import React from 'react'
import { useParams } from 'react-router'
import {
  AreaProps,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from 'recharts'
import { useTheme } from 'styled-components'
import { formatDate } from '../../utils/date'
import { formatBalance, formatBalanceAbbreviated, formatPercentage } from '../../utils/formatting'
import { useDailyPoolStates, usePool } from '../../utils/usePools'
import { Tooltips } from '../Tooltips'

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
      const poolValue = day.poolValue.toDecimal().toNumber()
      const reserve = poolValue - assetValue
      return { day: new Date(day.timestamp), cashDrag: assetValue / reserve || 0, reserve }
    }) || []

  const todayPoolValue = pool?.value.toDecimal().toNumber() || 0
  const todayAssetValue = pool?.nav.latest.toDecimal().toNumber() || 0
  const reserve = todayPoolValue - todayAssetValue
  const today: ChartData = {
    day: new Date(),
    cashDrag: todayAssetValue / reserve,
    reserve,
  }

  return (
    <Stack>
      <Legend data={today} currency={pool?.currency || ''} />
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
              <Line dot={false} dataKey="cashDrag" yAxisId="right" stroke={theme.colors.accentSecondary} />
              <Line dot={false} dataKey="reserve" yAxisId="left" stroke={theme.colors.accentPrimary} />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <Text variant="label1">No data yet</Text>
        )}
      </Shelf>
    </Stack>
  )
}

const CustomizedTooltip: React.VFC<TooltipProps<any, any> & { currency: string }> = ({ payload, currency }) => {
  const theme = useTheme()
  if (payload && payload?.length > 0) {
    const [reservePayload, cashDragPayload] = payload
    return (
      <Stack
        bg="backgroundPage"
        p="1"
        style={{
          boxShadow: `1px 3px 6px ${theme.colors.borderSecondary}`,
        }}
        minWidth="180px"
        gap="4px"
      >
        <Text variant="label2" fontWeight="500">
          {formatDate(payload[0].payload.day)}
        </Text>
        {[cashDragPayload, reservePayload].map((item) => {
          return (
            <Shelf key={item.dataKey} gap="4px" justifyContent="space-between">
              <Shelf gap="4px" alignItems="center">
                <Box width="11px" height="11px" borderRadius="100%" backgroundColor={item.color} />
                <Text variant="label2">{toSentenceCase(item.name)}</Text>
              </Shelf>
              <Text alignSelf="flex-end" textAlign="right" variant="label2">
                {item.name === 'reserve' ? formatBalance(item.value, currency) : formatPercentage(item.value)}
              </Text>
            </Shelf>
          )
        })}
      </Stack>
    )
  }
  return null
}

const Legend: React.VFC<{
  currency: string
  data: ChartData
}> = ({ data, currency }) => {
  const theme = useTheme()

  return (
    <Shelf bg="white" width="100%" gap="2">
      <Grid pl="4" pb="4" columns={6} gap="3" width="100%">
        <Stack borderLeftWidth="3px" pl="4px" borderLeftStyle="solid" borderLeftColor={theme.colors.accentPrimary}>
          <Tooltips variant="secondary" type="reserve" />
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

type CustomizedXAxisTickProps = {
  payload?: { value: Date }
  variant: 'months' | 'days'
} & Pick<AreaProps, 'x'> &
  Pick<AreaProps, 'y'>

const CustomizedXAxisTick: React.VFC<CustomizedXAxisTickProps> = ({ payload, x, y, variant }) => {
  let tick
  if (variant === 'months') {
    const formatter = new Intl.DateTimeFormat('en', { month: 'short' })
    // show month tick only on the first of every month
    tick = payload?.value && new Date(payload.value).getDate() === 1 ? formatter.format(payload?.value) : null
  } else {
    const formatter = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' })
    tick = formatter.format(payload?.value)
  }

  return (
    <g transform={`translate(${x},${y})`} style={{ fontSize: '10px', fontFamily: 'Inter' }}>
      <text x={0} y={0} dy={16} fontSize="10px" textAnchor="center">
        {tick}
      </text>
    </g>
  )
}

const toSentenceCase = (str: string) => {
  return str
    .split(/(?=[A-Z])/)
    .map((word, index) => {
      if (index === 0) return word.charAt(0).toUpperCase() + word.slice(1)
      return word.charAt(0).toLowerCase() + word.slice(1)
    })
    .join(' ')
}
