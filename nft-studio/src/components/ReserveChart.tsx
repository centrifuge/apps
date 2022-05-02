import { formatCurrencyAmount } from '@centrifuge/centrifuge-js'
import { Box, Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import { BN } from 'bn.js'
import React from 'react'
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
import data from './mockData.json'
import { Tooltips } from './Tooltips'

const scientificNotationToBN = (num: number) => new BN(num.toLocaleString('fullwide', { useGrouping: false }))

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
    poolValue: scientificNotationToBN(initialData.poolValue),
    assetValue: scientificNotationToBN(initialData.assetValue),
    reserve: scientificNotationToBN(initialData.reserve[1]).sub(scientificNotationToBN(initialData.reserve[0])),
    date: new Date(),
  }
  if (payload && payload?.length > 0 && active) {
    const { poolValue, assetValue, reserve } = payload[0]?.payload
    tooltipData = {
      poolValue: scientificNotationToBN(poolValue),
      assetValue: scientificNotationToBN(assetValue),
      reserve: scientificNotationToBN(reserve[1]).sub(scientificNotationToBN(reserve[0])),
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
          <Tooltips type="reserve" variant="lowercase" />
          <Text variant="body2">{formatCurrencyAmount(tooltipData.reserve)}</Text>
        </Stack>
        <Stack
          borderLeftWidth="3px"
          pl="4px"
          borderLeftStyle="solid"
          borderLeftColor={theme.colors.backgroundSecondary}
        >
          <Tooltips type="assetValue" variant="lowercase" />
          <Text variant="body2">{formatCurrencyAmount(tooltipData.assetValue)}</Text>
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
  const ref = React.useRef<HTMLDivElement>(null)

  return (
    <div ref={ref}>
      <Shelf
        gap="4"
        style={{ fontFamily: 'Inter', fontSize: '10px', color: theme.colors.textSecondary, width: '100%' }}
      >
        <ResponsiveContainer width="100%" height="100%" minHeight="200px">
          <ComposedChart
            width={754}
            height={173}
            data={data
              //  @ts-expect-error
              .sort((a, b) => a.day - b.day)
              .map((item) => ({
                reserve: [Number(item.reserve[0]) * 1e22, Number(item.reserve[1]) * 1e22],
                poolValue: Number(item.poolValue) * 1e22,
                assetValue: Number(item.assetValue) * 1e22,
                day: item.day,
              }))}
            margin={{ top: 60 }}
          >
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
                  initialData={{ reserve: [7.45e25, 8.9e25], poolValue: 8.9e25, assetValue: 7.45e25 }}
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
