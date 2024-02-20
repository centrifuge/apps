import { Card, Stack, Text } from '@centrifuge/fabric'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDate } from '../../utils/date'
import { formatBalance } from '../../utils/formatting'
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

  const getXAxisInterval = () => {
    if (rangeNumber <= 30) return 5
    if (rangeNumber > 30 && rangeNumber <= 90) {
      return 14
    }
    if (rangeNumber > 90 && rangeNumber <= 180) {
      return 30
    }
    return 45
  }

  return (
    <ResponsiveContainer>
      <AreaChart
        margin={{
          top: 35,
          right: 20,
          bottom: 0,
        }}
        data={dailyPortfolioValue?.reverse()}
      >
        <defs>
          <linearGradient id="colorPoolValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={chartColor} stopOpacity={0.3} />
            <stop offset="90%" stopColor="#F2F2F2" stopOpacity={0.8} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />

        <XAxis
          dataKey={({ dateInMilliseconds }) =>
            `${dateInMilliseconds?.toLocaleString('default', { month: 'short' })} ${dateInMilliseconds?.getDate()}`
          }
          tickLine={false}
          axisLine={false}
          style={{
            fontSize: '10px',
          }}
          dy={4}
          interval={getXAxisInterval()}
        />
        <YAxis
          dataKey={({ portfolioValue }) => portfolioValue}
          tickCount={10}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => value.toLocaleString()}
          style={{
            fontSize: '10px',
          }}
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

export const getRangeNumber = (rangeValue: string, poolAge?: number) => {
  if (rangeValue === '30d') {
    return 30
  }
  if (rangeValue === '90d') {
    return 90
  }

  if (rangeValue === 'ytd') {
    const today = new Date()
    const januaryFirst = new Date(today.getFullYear(), 0, 1)
    const timeDifference = new Date(today).getTime() - new Date(januaryFirst).getTime()
    const daysSinceJanuary1 = Math.floor(timeDifference / (1000 * 60 * 60 * 24))

    return daysSinceJanuary1
  }

  if (rangeValue === 'all' && poolAge) {
    return poolAge
  }

  return 30
}
