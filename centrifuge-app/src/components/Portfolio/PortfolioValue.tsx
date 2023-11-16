import { Card, Stack, Text } from '@centrifuge/fabric'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDate } from '../../utils/date'
import { formatBalance } from '../../utils/formatting'

const chartColor = '#006EF5'

const data = [
  {
    portfolioValue: 123809,
    dateInMilliseconds: Date.now(),
    month: 'Jan',
  },
  {
    portfolioValue: 123809,
    dateInMilliseconds: Date.now() - 86400000, // 1 day ago
    month: 'Feb',
  },
  {
    portfolioValue: 123809,
    dateInMilliseconds: Date.now() - 86400000 * 2, // 2 days ago
    month: 'Mar',
  },
  {
    portfolioValue: 2023480,
    dateInMilliseconds: Date.now() - 86400000 * 3, // 3 days ago
    month: 'Apr',
  },
  {
    portfolioValue: 3023480,
    dateInMilliseconds: Date.now() - 86400000 * 4, // 4 days ago
    month: 'May',
  },
  {
    portfolioValue: 4023480,
    dateInMilliseconds: Date.now() - 86400000 * 5, // 5 days ago
    month: 'Jun',
  },
  {
    portfolioValue: 7023480,
    dateInMilliseconds: Date.now() - 86400000 * 6, // 6 days ago
    month: 'Jul',
  },
  {
    portfolioValue: 8023480,
    dateInMilliseconds: Date.now() - 86400000 * 7, // 7 days ago
    month: 'Aug',
  },
  {
    portfolioValue: 9023480,
    dateInMilliseconds: Date.now() - 86400000 * 8, // 8 days ago
    month: 'Sep',
  },
  {
    portfolioValue: 10023480,
    dateInMilliseconds: Date.now() - 86400000 * 9, // 9 days ago
    month: 'Oct',
  },
  {
    portfolioValue: 11023480,
    dateInMilliseconds: Date.now() - 86400000 * 10, // 10 days ago
    month: 'Nov',
  },
  {
    portfolioValue: 12023480,
    dateInMilliseconds: Date.now() - 86400000 * 11, // 11 days ago
    month: 'Dec',
  },
]

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

export function PortfolioValue() {
  return (
    <ResponsiveContainer>
      <AreaChart
        margin={{
          top: 35,
          right: 0,
          left: 30,
          bottom: 0,
        }}
        data={data}
      >
        <defs>
          <linearGradient id="colorPoolValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={chartColor} stopOpacity={0.3} />
            <stop offset="90%" stopColor="#F2F2F2" stopOpacity={0.8} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />

        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          style={{
            fontSize: '10px',
          }}
          dy={4}
        />
        <YAxis
          dataKey="portfolioValue"
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
