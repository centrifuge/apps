import { Box, Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import css from '@styled-system/css'
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
import { formatBalance, formatBalanceAbbreviated } from '../utils/formatting'
import { useDailyPoolStates, usePool } from '../utils/usePools'

type ChartData = {
  day: Date
  poolValue: number
  assetValue: number
  reserve: [number, number]
}

export const ReserveChart: React.VFC = () => {
  const theme = useTheme()
  const { pid: poolId } = useParams<{ pid: string }>()
  const ref = React.useRef<HTMLDivElement>(null)
  const poolStates = useDailyPoolStates(poolId)
  const pool = usePool(poolId)

  const data: ChartData[] =
    poolStates?.map((day) => {
      const assetValue = day.poolState.netAssetValue.toDecimal().toNumber()
      const poolValue = day.poolValue.toDecimal().toNumber()
      return { day: new Date(day.timestamp), poolValue, assetValue, reserve: [assetValue, poolValue] }
    }) || []

  const todayPoolValue = pool?.value.toDecimal().toNumber() || 0
  const todayAssetValue = pool?.nav.latest.toDecimal().toNumber() || 0
  const dataIncludingToday: ChartData[] = [
    ...data,
    {
      day: new Date(),
      poolValue: todayPoolValue,
      assetValue: todayAssetValue,
      reserve: [todayAssetValue, todayPoolValue],
    },
  ]

  const poolCurrency = pool?.currency || ''
  return (
    <div ref={ref}>
      <StyledWrapper gap="4" mt="5">
        {dataIncludingToday?.length ? (
          <ResponsiveContainer width="100%" height="100%" minHeight="200px">
            <ComposedChart width={754} height={173} data={dataIncludingToday} margin={{ top: 10, left: -30 }}>
              <XAxis
                dataKey="day"
                tick={<CustomizedXAxisTick variant={dataIncludingToday.length > 30 ? 'months' : 'days'} />}
                tickLine={false}
                interval={0}
                type="category"
              />
              <YAxis allowDecimals tickLine={false} tickFormatter={(tick: number) => formatBalanceAbbreviated(tick)} />
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
                allowEscapeViewBox={{ x: false, y: true }}
                content={
                  <CustomizedTooltip
                    width={ref?.current?.offsetWidth}
                    initialData={dataIncludingToday[dataIncludingToday.length - 1]}
                    currency={poolCurrency}
                  />
                }
                position={{ x: -20, y: -10 }}
                wrapperStyle={{ visibility: 'visible' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <Text variant="label1">No data yet</Text>
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
  currency: string
  initialData: ChartData
}

const CustomizedTooltip: React.VFC<CustomizedTooltipProps> = ({ payload, active, width, initialData, currency }) => {
  const theme = useTheme()
  let tooltipData = {
    poolValue: initialData.poolValue,
    assetValue: initialData.assetValue,
    reserve: initialData.reserve[1] - initialData.reserve[0],
    date: new Date(),
  }
  if (payload && payload?.length > 0 && active) {
    const { poolValue, assetValue, reserve } = payload[0]?.payload
    tooltipData = {
      poolValue,
      assetValue,
      reserve: reserve[1] - reserve[0],
      date: payload[0]?.payload?.day,
    }
  }
  const date = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(Number(tooltipData.date) || 0))
  return (
    <Shelf bg="white" width={'100%'} gap="2" position="relative" top={-50}>
      <Grid pl="55px" pt="10px" columns={4} gap="4" width="100%">
        <Stack
          borderLeftWidth="3px"
          pl="4px"
          borderLeftStyle="solid"
          borderLeftColor={theme.colors.accentPrimary}
          minWidth="148px"
        >
          <Text variant="label2">Pool value</Text>
          <Text variant="body2">{formatBalance(tooltipData.poolValue, currency)}</Text>
        </Stack>
        <Stack
          minWidth="148px"
          borderLeftWidth="3px"
          pl="4px"
          borderLeftStyle="solid"
          borderLeftColor={theme.colors.accentSecondary}
        >
          <Text variant="label2">Asset value`</Text>
          <Text variant="body2">{formatBalance(tooltipData.assetValue, currency)}</Text>
        </Stack>
        <Stack
          minWidth="148px"
          borderLeftWidth="3px"
          pl="4px"
          borderLeftStyle="solid"
          borderLeftColor={theme.colors.borderSecondary}
        >
          <Text variant="label2">Reserve</Text>
          <Text variant="body2">{formatBalance(tooltipData.reserve, currency)}</Text>
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
    // show month tick only on the first of every month
    tick = payload?.value && new Date(payload.value).getDate() === 1 ? formatter.format(payload?.value) : null
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
