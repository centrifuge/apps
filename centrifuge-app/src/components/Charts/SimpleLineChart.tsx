import { CurrencyBalance, CurrencyMetadata } from '@centrifuge/centrifuge-js'
import { Box, Card, Select, Shelf, Stack, Text } from '@centrifuge/fabric'
import { useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTheme } from 'styled-components'
import { formatDate } from '../../utils/date'
import { formatBalance, formatBalanceAbbreviated } from '../../utils/formatting'
import { TooltipContainer, TooltipTitle } from './Tooltip'

const rangeFilters = [
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'ytd', label: 'Year to date' },
  { value: 'all', label: 'All' },
]

type ChartData = {
  name: string
  yAxis: Number
}

interface Props {
  data: ChartData[]
  currency?: CurrencyMetadata
  tooltip?: (value: any) => { value: any; label: string }
  withFilters?: boolean
  filters: {
    type: 'default' | { value: string; label: string }
    title: string
    legend: [
      {
        label: string
        color: string
        value: string
      }
    ]
  }
}

const Dot = ({ color }: { color: string }) => (
  <Box width="8px" height="8px" borderRadius="50%" backgroundColor={color} marginRight="4px" />
)

// We use the chart for pages: asset, prime, portfolio
export const SimpleLineChart = ({ data, currency, tooltip, filters }: Props) => {
  const theme = useTheme()
  const chartColor = theme.colors.accentPrimary

  const [range, setRange] = useState<(typeof rangeFilters)[number]>(rangeFilters[0])

  const toggleRange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    const range = rangeFilters.find((range) => range.value === value)
    setRange(range ?? rangeFilters[0])
  }

  console.log(data)

  return (
    <Card padding={3} variant="secondary">
      {filters && <Text variant="heading4">{filters.title}</Text>}
      {filters && (
        <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
          {filters.legend.map((legend) => (
            <Box mt={3}>
              <Box display="flex" alignItems="center">
                <Dot color={legend.color} />
                <Text variant="body3" color="textSecondary">
                  {legend.label}
                </Text>
              </Box>
              <Text variant="heading1">{legend.value}</Text>
            </Box>
          ))}
          <Select options={rangeFilters} onChange={toggleRange} hideBorder />
        </Box>
      )}
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
                            if (tooltip) {
                              const { label, value: val } = tooltip(payload[0].payload)
                              return (
                                <Shelf justifyContent="space-between" pl="4px" key={index}>
                                  <Text variant="body3">{label}</Text>
                                  <Text variant="body3">{val}</Text>
                                </Shelf>
                              )
                            }
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
