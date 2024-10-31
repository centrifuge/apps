import { CurrencyBalance, CurrencyMetadata } from '@centrifuge/centrifuge-js'
import { Card, Shelf, Stack, Text } from '@centrifuge/fabric'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTheme } from 'styled-components'
import { formatDate } from '../../utils/date'
import { formatBalance, formatBalanceAbbreviated } from '../../utils/formatting'
import { TooltipContainer, TooltipTitle } from './Tooltip'

type ChartData = {
  name: string
  yAxis: Number
}

interface Props {
  data: ChartData[]
  currency?: CurrencyMetadata
}

export const SimpleLineChart = ({ data, currency }: Props) => {
  const theme = useTheme()
  const chartColor = theme.colors.accentPrimary

  return (
    <Card padding={3} variant="secondary">
      <Stack gap={2}>
        {!data.length && (
          <Text variant="body3" style={{ margin: '80px auto 0px' }}>
            No data available
          </Text>
        )}

        <Shelf gap={4} width="100%">
          {data?.length ? (
            <ResponsiveContainer width="100%" height={200} minHeight={200} maxHeight={200}>
              <LineChart data={data} margin={{ left: -36 }}>
                <defs>
                  <linearGradient id="colorPoolValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  type="category"
                  tickFormatter={(tick: number) => {
                    return new Date(tick).toLocaleString('en-US', { day: 'numeric', month: 'short' })
                  }}
                  style={{ fontSize: 8, fill: theme.colors.textPrimary, letterSpacing: '-0.7px' }}
                  dy={4}
                  interval={10}
                  angle={-40}
                  textAnchor="end"
                />
                <YAxis
                  stroke="none"
                  tickLine={false}
                  style={{ fontSize: '10px', fill: theme.colors.textPrimary }}
                  tickFormatter={(tick: number) => {
                    const balance = new CurrencyBalance(tick, currency?.decimals || 0)
                    return formatBalanceAbbreviated(balance, '', 0)
                  }}
                  width={90}
                />
                <CartesianGrid stroke={theme.colors.borderPrimary} vertical={false} />
                <Tooltip
                  content={({ payload }) => {
                    if (payload && payload?.length > 0) {
                      return (
                        <TooltipContainer>
                          <TooltipTitle>{formatDate(payload[0].payload.name)}</TooltipTitle>
                          {payload.map(({ value }, index) => {
                            return (
                              <Shelf justifyContent="space-between" pl="4px" key={index}>
                                <Text variant="body3">Value</Text>
                                <Text variant="body3">
                                  {formatBalance(
                                    new CurrencyBalance(value?.toString() ?? 0, currency?.decimals || 0),
                                    'USD',
                                    2,
                                    2
                                  )}
                                </Text>
                              </Shelf>
                            )
                          })}
                        </TooltipContainer>
                      )
                    }
                    return null
                  }}
                />

                <Line type="monotone" dataKey="yAxis" stroke={theme.colors.textGold} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : null}
        </Shelf>
      </Stack>
    </Card>
  )
}
