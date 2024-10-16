import { Card, Stack, Text } from '@centrifuge/fabric'
import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDate } from '../../utils/date'
import { formatBalance, formatBalanceAbbreviated } from '../../utils/formatting'
import { CustomTick } from '../Charts/PoolPerformanceChart'
import { getOneDayPerMonth, getRangeNumber } from '../Charts/utils'
import { useDailyPortfolioValue } from './usePortfolio'

const chartColor = '#006ef5'

const TooltipInfo = ({ payload }: any) => {
  if (payload) {
    const portfolioValue = payload[0]?.payload.portfolioValue
    const date = payload[0]?.payload.dateInMilliseconds

    return (
      <Card p={1} minHeight="53px" minWidth="163px" style={{ borderRadius: '4px' }}>
        <Stack gap={1}>
          <Text variant="body3">
            <Text variant="emphasized">{formatDate(date)}</Text>
          </Text>
          <Text variant="body3">{portfolioValue && formatBalance(portfolioValue, 'USD', 2, 2)}</Text>
        </Stack>
      </Card>
    )
  }

  return null
}

export function PortfolioValue({ rangeValue, address }: { rangeValue: string; address: string }) {
  const rangeNumber = getRangeNumber(rangeValue)
  const dailyPortfolioValue = useDailyPortfolioValue(address, rangeNumber)

  const chartData = dailyPortfolioValue?.map((value) => ({
    ...value,
    portfolioValue: value.portfolioValue.toNumber(),
  }))

  const yAxisDomain = useMemo(() => {
    if (chartData?.length) {
      const values = chartData.map((data) => data.portfolioValue)
      return [Math.min(...values), Math.max(...values)]
    }
  }, [chartData])

  if (!chartData?.length) return

  return (
    <ResponsiveContainer height={300} maxHeight={300} minHeight={300}>
      <AreaChart
        margin={{
          top: 35,
          right: 20,
          bottom: 0,
        }}
        data={chartData?.reverse()}
      >
        <defs>
          <linearGradient id="colorPoolValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={chartColor} stopOpacity={0.3} />
            <stop offset="90%" stopColor="#F2F2F2" stopOpacity={0.8} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="dateInMilliseconds"
          tickLine={false}
          axisLine={false}
          style={{
            fontSize: '10px',
          }}
          dy={4}
          interval={0}
          minTickGap={100000}
          type="category"
          ticks={getOneDayPerMonth(chartData, 'dateInMilliseconds')}
          tick={<CustomTick />}
        />
        <YAxis
          dataKey="portfolioValue"
          tickCount={10}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatBalanceAbbreviated(value, '', 2)}
          style={{
            fontSize: '10px',
          }}
          domain={yAxisDomain}
          label={{
            value: 'USD',
            position: 'top',
            offset: 15,
            fontSize: '12px',
          }}
        />

        <Tooltip content={<TooltipInfo />} />
        <Area
          type="monotone"
          dataKey="portfolioValue"
          strokeWidth={1}
          fillOpacity={1}
          fill="url(#colorPoolValue)"
          name="Value"
          stroke={`${chartColor}30`}
          activeDot={{ fill: chartColor }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
