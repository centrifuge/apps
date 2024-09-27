import { CurrencyMetadata } from '@centrifuge/centrifuge-js'
import { Text } from '@centrifuge/fabric'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTheme } from 'styled-components'
import { formatDate } from '../../../src/utils/date'
import { formatBalance, formatBalanceAbbreviated } from '../../../src/utils/formatting'
import { LoadBoundary } from '../LoadBoundary'
import { CustomTick } from './PoolPerformanceChart'
import { TooltipContainer, TooltipTitle } from './Tooltip'

type SimpleBarChartProps = {
  currency?: CurrencyMetadata
  data: { name: string; yAxis: number }[]
}

export const SimpleBarChart = ({ currency, data }: SimpleBarChartProps) => {
  const theme = useTheme()

  const getOneDayPerMonth = () => {
    const seenMonths = new Set<string>()
    const result: string[] = []

    data.forEach((item) => {
      const date = new Date(item.name)
      const month = date.getMonth() + 1
      const year = date.getFullYear()
      const monthYear = `${year}-${month}`

      if (!seenMonths.has(monthYear)) {
        seenMonths.add(monthYear)
        result.push(item.name)
      }
    })

    return result
  }

  if (!data.length) return
  return (
    <LoadBoundary>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart width={500} height={300} data={data} barSize={16} barGap={16} barCategoryGap="20%">
          <CartesianGrid stroke={theme.colors.borderPrimary} vertical={false} />
          <XAxis
            dy={4}
            interval={0}
            minTickGap={100000}
            tickLine={false}
            type="category"
            dataKey="name"
            ticks={getOneDayPerMonth()}
            tick={<CustomTick />}
          />
          <YAxis
            tickFormatter={(tick: number) => formatBalanceAbbreviated(tick, '', 0)}
            tick={{ fontSize: 10, color: theme.colors.textPrimary }}
            tickLine={false}
          />
          <Tooltip
            cursor={false}
            content={({ payload }) => {
              if (payload && payload?.length > 0) {
                return (
                  <TooltipContainer>
                    <TooltipTitle>{formatDate(payload[0].payload.name)}</TooltipTitle>
                    {payload.map((item) => (
                      <Text variant="body3">{formatBalance(item.value as number, currency)}</Text>
                    ))}
                  </TooltipContainer>
                )
              }
            }}
          />
          <Bar dataKey="yAxis" fill={theme.colors.backgroundTertiary} strokeWidth={0} fillOpacity={1} />
        </BarChart>
      </ResponsiveContainer>
    </LoadBoundary>
  )
}
