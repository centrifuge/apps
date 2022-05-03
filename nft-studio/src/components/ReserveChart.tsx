import { formatCurrencyAmount } from '@centrifuge/centrifuge-js'
import { Box, Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import { BN } from 'bn.js'
import React from 'react'
import { useParams } from 'react-router'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  XAxisProps,
  YAxis,
} from 'recharts'
import { useTheme } from 'styled-components'
import { useDailyPoolStates } from '../utils/usePools'
import { Tooltips } from './Tooltips'

type CustomizedTooltipProps = TooltipProps<any, any> & {
  width?: number
  initialData: {
    poolValue: number
    assetValue: number
    reserve: [number, number]
  }
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
  const date = new Intl.DateTimeFormat('en-US').format(new Date(Number(tooltipData.date) || 0))
  return (
    <Shelf bg="white" width={width || '100%'} gap="2" position="relative">
      <Grid pl="55px" pt="10px" columns={4} gap="4" width="100%" equalColumns>
        <Stack borderLeftWidth="3px" pl="4px" borderLeftStyle="solid" borderLeftColor={theme.colors.accentPrimary}>
          <Tooltips type="poolValue" variant="lowercase" />
          <Text variant="body2">{formatCurrencyAmount(tooltipData.poolValue)}</Text>
        </Stack>
        <Stack borderLeftWidth="3px" pl="4px" borderLeftStyle="solid" borderLeftColor={theme.colors.accentSecondary}>
          <Tooltips type="assetValue" variant="lowercase" />
          <Text variant="body2">{formatCurrencyAmount(tooltipData.assetValue)}</Text>
        </Stack>
        <Stack
          borderLeftWidth="3px"
          pl="4px"
          borderLeftStyle="solid"
          borderLeftColor={theme.colors.backgroundSecondary}
        >
          <Tooltips type="reserve" variant="lowercase" />
          <Text variant="body2">{formatCurrencyAmount(tooltipData.reserve)}</Text>
        </Stack>
        <Box alignSelf="flex-end" justifySelf="end">
          <Text variant="body2">{date}</Text>
        </Box>
      </Grid>
    </Shelf>
  )
}

type CustomizedXAxisTickProps = XAxisProps & { payload?: any }

const CustomizedXAxisTick: React.VFC<CustomizedXAxisTickProps> = ({ payload, x, y }) => {
  const formatter = new Intl.DateTimeFormat('en', { month: 'short' })
  const month = formatter.format(payload.value)

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="end" fill="#666">
        {month}
      </text>
    </g>
  )
}

export const ReserveChart: React.VFC = () => {
  const theme = useTheme()
  const { pid } = useParams<{ pid: string }>()
  const ref = React.useRef<HTMLDivElement>(null)
  const poolStates = useDailyPoolStates(pid)

  const data = poolStates?.dailyPoolStates.nodes.map((day) => {
    const assetValue = day.poolState.netAssetValue
    const poolValue = new BN(day.poolState.netAssetValue).add(new BN(assetValue)).toString()
    return { day: new Date(day.timestamp), poolValue: poolValue, assetValue, reserve: [assetValue, poolValue] }
  })

  return (
    <div ref={ref}>
      <Shelf
        gap="4"
        style={{ fontFamily: 'Inter', fontSize: '10px', color: theme.colors.textSecondary, width: '100%' }}
      >
        <ResponsiveContainer width="100%" height="100%" minHeight="200px">
          <ComposedChart width={754} height={173} data={data} margin={{ top: 60 }}>
            <XAxis interval={10} dataKey="day" tick={<CustomizedXAxisTick />} tickLine={false} />
            <YAxis
              tickLine={false}
              tickFormatter={(tick) =>
                `${new BN(tick.toLocaleString('fullwide', { useGrouping: false }))
                  .div(new BN(10).pow(new BN(25)))
                  .toString()}M`
              }
            />
            <CartesianGrid stroke={theme.colors.borderSecondary} />
            <Area
              fill={theme.colors.backgroundSecondary}
              dataKey="reserve"
              stroke={theme.colors.backgroundSecondary}
              opacity={1}
              fillOpacity={1}
            />
            <Line
              type="monotone"
              dataKey="assetValue"
              stroke={theme.colors.accentSecondary}
              fill="transparent"
              dot={false}
            />
            <Line
              dot={false}
              type="monotone"
              dataKey="poolValue"
              stroke={theme.colors.accentPrimary}
              fill="transparent"
            />
            <Tooltip
              content={
                <CustomizedTooltip
                  width={ref?.current?.offsetWidth}
                  //   fill with values from today
                  initialData={data[data.length - 1]}
                />
              }
              position={{ x: 0, y: -10 }}
              wrapperStyle={{ visibility: 'visible' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Shelf>
    </div>
  )
}
