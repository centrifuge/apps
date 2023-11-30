import { useAddress, useCentrifugeUtils } from '@centrifuge/centrifuge-react'
import { Card, Stack, Text } from '@centrifuge/fabric'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDate } from '../../utils/date'
import { formatBalance } from '../../utils/formatting'
import { useDailyPortfolioValue } from '../../utils/usePools'

const chartColor = '#006ef5'

const TooltipInfo = ({ payload }: any) => {
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

export function PortfolioValue({ rangeValue }: { rangeValue: string }) {
  const address = useAddress()
  const { formatAddress } = useCentrifugeUtils()
  const dailyPortfolioValue = useDailyPortfolioValue(formatAddress(address || ''), getRangeNumber(rangeValue))

  return (
    <ResponsiveContainer>
      <AreaChart
        margin={{
          top: 35,
          right: 0,
          left: 30,
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
          dataKey={({ dateInMilliseconds }) => `${dateInMilliseconds?.getMonth() + 1}/${dateInMilliseconds?.getDate()}`}
          tickLine={false}
          axisLine={false}
          style={{
            fontSize: '10px',
          }}
          dy={4}
        />
        <YAxis
          dataKey={({ portfolioValue }) => portfolioValue.toString()}
          tickCount={10}
          tickLine={false}
          axisLine={false}
          style={{
            fontSize: '10px',
          }}
          dx={-4}
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

const getRangeNumber = (rangeValue: string) => {
  if (rangeValue === '30d') {
    return 30
  }
  if (rangeValue === '90d') {
    return 90
  }

  const today = new Date()
  const januaryFirst = new Date(today.getFullYear(), 0, 1)
  const timeDifference = new Date(today).getTime() - new Date(januaryFirst).getTime()
  const daysSinceJanuary1 = Math.floor(timeDifference / (1000 * 60 * 60 * 24))

  return daysSinceJanuary1
}
