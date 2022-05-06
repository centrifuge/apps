import { formatCurrencyAmount } from '@centrifuge/centrifuge-js'
import { Box, Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import css from '@styled-system/css'
import { BN } from 'bn.js'
import React from 'react'
import { useParams } from 'react-router'
import {
  Area,
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
import styled, { useTheme } from 'styled-components'
import { useDailyPoolStates } from '../utils/usePools'
import { Tooltips } from './Tooltips'

const TABLE_SCALE_FACTOR = new BN(1e15)

type ChartData = {
  day: Date
  poolValue: number
  assetValue: number
  reserve: [number, number]
}

export const ReserveChart: React.VFC = () => {
  const theme = useTheme()
  const { pid } = useParams<{ pid: string }>()
  const ref = React.useRef<HTMLDivElement>(null)
  const poolStates = useDailyPoolStates(pid)

  const data: ChartData[] =
    poolStates?.map((day) => {
      // display decimals on y axis chart ?
      const assetValue = new BN(day.poolState.netAssetValue).div(TABLE_SCALE_FACTOR).toNumber()
      const poolValue = new BN(day.poolValue).div(TABLE_SCALE_FACTOR).toNumber()
      return { day: new Date(day.timestamp), poolValue, assetValue, reserve: [assetValue, poolValue] }
    }) || []

  return (
    <div ref={ref}>
      <StyledWrapper
        gap="4"
        style={{ fontFamily: 'Inter', fontSize: '10px', color: theme.colors.textSecondary, width: '100%' }}
      >
        {data?.length ? (
          <ResponsiveContainer width="100%" height="100%" minHeight="200px">
            <ComposedChart width={754} height={173} data={data} margin={{ top: 60 }}>
              <XAxis
                dataKey="day"
                tick={<CustomizedXAxisTick variant={data.length > 30 ? 'months' : 'days'} />}
                tickLine={false}
                interval={0}
                type="category"
              />
              <YAxis
                allowDecimals
                tickLine={false}
                tickFormatter={
                  (tick) => tick
                  // use new formatting utils after merge main
                  // formatCurrencyAmount(new BN(tick.toLocaleString('fullwide', { useGrouping: false })))
                }
              />
              <CartesianGrid stroke={theme.colors.borderSecondary} />
              <Area
                fill={theme.colors.backgroundSecondary}
                dataKey="reserve"
                stroke={theme.colors.backgroundSecondary}
                fillOpacity={1}
              />
              <Line dataKey="assetValue" stroke={theme.colors.accentSecondary} fill="transparent" dot={false} />
              <Line dot={false} dataKey="poolValue" stroke={theme.colors.accentPrimary} fill="transparent" />
              <Tooltip
                content={<CustomizedTooltip width={ref?.current?.offsetWidth} initialData={data[data.length - 1]} />}
                position={{ x: 0, y: -10 }}
                wrapperStyle={{ visibility: 'visible' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <Text variant="label1">No data</Text>
        )}
      </StyledWrapper>
    </div>
  )
}

const StyledWrapper = styled(Shelf)(
  css({
    fontFamily: 'Inter',
    fontSize: '10px',
    color: 'textSecondary',
    width: '100%',
  })
)

type CustomizedTooltipProps = TooltipProps<any, any> & {
  width?: number
  initialData: ChartData
}

const CustomizedTooltip: React.VFC<CustomizedTooltipProps> = ({ payload, active, width, initialData }) => {
  const theme = useTheme()
  let tooltipData = {
    poolValue: new BN(initialData.poolValue),
    assetValue: new BN(initialData.assetValue),
    reserve: new BN(initialData.reserve[1]).sub(new BN(initialData.reserve[0])),
    date: new Date(),
  }
  if (payload && payload?.length > 0 && active) {
    const { poolValue, assetValue, reserve } = payload[0]?.payload
    tooltipData = {
      poolValue: new BN(poolValue),
      assetValue: new BN(assetValue),
      reserve: new BN(reserve[1]).sub(new BN(reserve[0])),
      date: payload[0]?.payload?.day,
    }
  }
  const date = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(Number(tooltipData.date) || 0))
  return (
    <Shelf bg="white" width={width || '100%'} gap="2" position="relative">
      <Grid pl="55px" pt="10px" columns={4} gap="4" width="100%" equalColumns>
        <Stack borderLeftWidth="3px" pl="4px" borderLeftStyle="solid" borderLeftColor={theme.colors.accentPrimary}>
          <Tooltips type="poolValue" variant="lowercase" />
          <Text variant="body2">{formatCurrencyAmount(new BN(tooltipData.poolValue).mul(TABLE_SCALE_FACTOR))}</Text>
        </Stack>
        <Stack borderLeftWidth="3px" pl="4px" borderLeftStyle="solid" borderLeftColor={theme.colors.accentSecondary}>
          <Tooltips type="assetValue" variant="lowercase" />
          <Text variant="body2">{formatCurrencyAmount(new BN(tooltipData.assetValue).mul(TABLE_SCALE_FACTOR))}</Text>
        </Stack>
        <Stack borderLeftWidth="3px" pl="4px" borderLeftStyle="solid" borderLeftColor={theme.colors.borderSecondary}>
          <Tooltips type="reserve" variant="lowercase" />
          <Text variant="body2">{formatCurrencyAmount(new BN(tooltipData.reserve).mul(TABLE_SCALE_FACTOR))}</Text>
        </Stack>
        <Box alignSelf="flex-end" justifySelf="end">
          <Text variant="body2">{date}</Text>
        </Box>
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
    tick = payload?.value && new Date(payload.value).getDate() === 2 ? formatter.format(payload?.value) : null
  } else {
    const formatter = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' })
    tick = formatter.format(payload?.value)
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} fontSize="10px" textAnchor="center">
        {tick}
      </text>
    </g>
  )
}
