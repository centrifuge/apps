import { CurrencyMetadata } from '@centrifuge/centrifuge-js'
import { Box, Shelf, Text } from '@centrifuge/fabric'
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTheme } from 'styled-components'
import { formatDate } from '../../../src/utils/date'
import { formatBalance, formatDecimalAbbreviated } from '../../../src/utils/formatting-sdk'
import { LoadBoundary } from '../LoadBoundary'
import { CustomTick } from './PoolPerformanceChart'
import { TooltipContainer, TooltipTitle } from './Tooltip'

type SimpleBarChartProps = {
  currency?: CurrencyMetadata
  data: { name: string; yAxis: number }[]
  groupBy?: string
}

export const SimpleBarChart = ({ currency, data, groupBy }: SimpleBarChartProps) => {
  const theme = useTheme()
  const isSmallerBar = groupBy === 'daily' || false

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

  if (!data.length)
    return (
      <Shelf justifyContent="center">
        <Text>No data available</Text>
      </Shelf>
    )

  return (
    <LoadBoundary>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart width={500} height={300} data={data} barSize={10} barGap={10}>
          <CartesianGrid stroke={theme.colors.borderPrimary} vertical={false} />
          <XAxis
            dy={4}
            interval={0}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            type="category"
            dataKey="name"
            ticks={getOneDayPerMonth()}
            tick={(props) => <CustomTick {...props} />}
            angle={45}
          />
          <YAxis
            tickFormatter={(tick: any) => formatDecimalAbbreviated(tick, 0)}
            tick={{ fontSize: 10, color: theme.colors.textPrimary }}
            tickLine={false}
            axisLine={false}
            dataKey="yAxis"
          />
          <ReferenceLine y={0} stroke={theme.colors.textSecondary} />

          <Tooltip
            cursor={false}
            content={({ payload }) => {
              if (payload && payload?.length > 0) {
                return (
                  <TooltipContainer>
                    {payload.map((item) => {
                      return (
                        <Box>
                          <TooltipTitle>{formatDate(item.payload.name)}</TooltipTitle>
                          <Text variant="body3">{formatBalance(item.value ?? 0, 2, currency?.displayName)}</Text>
                        </Box>
                      )
                    })}
                  </TooltipContainer>
                )
              }
            }}
          />
          <Bar
            dataKey="yAxis"
            name="yAxis"
            fill={theme.colors.backgroundTertiary}
            strokeWidth={0}
            fillOpacity={1}
            barSize={isSmallerBar ? 20 : 80}
          />
        </BarChart>
      </ResponsiveContainer>
    </LoadBoundary>
  )
}
