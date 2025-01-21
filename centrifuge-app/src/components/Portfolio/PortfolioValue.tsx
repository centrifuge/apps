import { Box, Card, Stack, Text } from '@centrifuge/fabric'
import { useMemo } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTheme } from 'styled-components'
import { formatDate } from '../../utils/date'
import { formatBalance, formatBalanceAbbreviated } from '../../utils/formatting'
import { CustomTick } from '../Charts/PoolPerformanceChart'
import { getOneDayPerMonth, getRangeNumber } from '../Charts/utils'
import { useDailyPortfolioValue } from './usePortfolio'

const interval: Record<30 | 90, number> = {
  30: 2,
  90: 4,
}

const chartColor = 'black'

const TooltipInfo = ({ payload }: any) => {
  if (payload) {
    const portfolioValue = payload[0]?.payload.portfolioValue
    const date = payload[0]?.payload.dateInMilliseconds

    return (
      <Card
        p={1}
        minHeight="53px"
        width={300}
        style={{ borderRadius: '4px', boxShadow: '1px 3px 6px 0px rgba(0, 0, 0, 0.15)' }}
      >
        <Stack gap={1}>
          <Text variant="body3">
            <Text variant="emphasized">{formatDate(date)}</Text>
          </Text>
          {portfolioValue && (
            <Box display="flex" justifyContent="space-between">
              <Text variant="body3">Portfolio value</Text>
              <Text variant="body3">{formatBalance(portfolioValue, 'USD', 2, 2)}</Text>
            </Box>
          )}
        </Stack>
      </Card>
    )
  }

  return null
}

export function PortfolioValue({ rangeValue, address }: { rangeValue: string; address: string }) {
  const theme = useTheme()
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
      <LineChart
        margin={{
          top: 35,
          right: 20,
          bottom: 0,
          left: -5,
        }}
        data={chartData?.reverse()}
      >
        <defs>
          <linearGradient id="colorPoolValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
            <stop offset="95%" stopColor={chartColor} stopOpacity={0.2} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={theme.colors.backgroundTertiary} />
        <XAxis
          dataKey="dateInMilliseconds"
          tickLine={false}
          axisLine={false}
          style={{
            fontSize: '10px',
          }}
          dy={4}
          interval={rangeNumber && (rangeNumber === 30 || rangeNumber === 90) ? interval[rangeNumber] : 0}
          type="category"
          ticks={rangeNumber && rangeNumber <= 90 ? undefined : getOneDayPerMonth(chartData, 'dateInMilliseconds')}
          tick={(props) => <CustomTick filterValue={rangeNumber} {...props} />}
        />
        <YAxis
          dataKey="portfolioValue"
          tickCount={10}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatBalanceAbbreviated(value, '', 3)}
          style={{
            fontSize: '10px',
          }}
          domain={yAxisDomain}
        />

        <Tooltip content={<TooltipInfo />} />
        <Line type="monotone" dataKey="portfolioValue" stroke={theme.colors.textGold} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
