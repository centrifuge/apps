import { Box, Select, Shelf, Stack, StatusChip, Text } from '@centrifuge/fabric'
import React from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTheme } from 'styled-components'
import { Dec } from '../../utils/Decimal'
import { CustomizedTooltip } from './Tooltip'

export type FilterOptions = 'YTD' | '30days' | '90days'

type PriceChartProps = {
  data: { day: Date; price: number; apy: number }[]
  currency: string
  filter?: FilterOptions
  setFilter?: React.Dispatch<React.SetStateAction<FilterOptions>>
  isPrice: boolean
}

export const PriceChart = ({ data, currency, filter, setFilter, isPrice }: PriceChartProps) => {
  const theme = useTheme()
  const currentPrice = data.at(-1)?.price

  const priceDifference = React.useMemo(() => {
    const dayZeroPrice = data.at(0)?.price
    if (!currentPrice || !dayZeroPrice) return null
    return Dec(currentPrice).sub(dayZeroPrice).div(dayZeroPrice)
  }, [data, currentPrice])

  return (
    <Stack gap={0}>
      <Shelf gap={1} justifyContent="space-between">
        <Shelf gap={1}>
          {currentPrice && (
            <Text variant="body3">
              {currency} - {currentPrice.toFixed(4)} USD
            </Text>
          )}
          {priceDifference && (
            <StatusChip status={priceDifference.gte(0) ? 'ok' : 'critical'}>
              <Text variant="body3" color={priceDifference.gte(0) ? 'statusOk' : 'statusCritical'}>
                {' '}
                {priceDifference.gte(0) ? '+' : ''} {priceDifference.mul(100).toFixed(2)}%
              </Text>
            </StatusChip>
          )}
        </Shelf>
        {filter && setFilter && (
          <Box alignSelf="flex-end" justifySelf="flex-end">
            <Select
              options={[
                { label: '30 days', value: '30days' },
                { label: '90 days', value: '90days' },
                { label: 'YTD', value: 'YTD' },
              ]}
              onChange={(option) => setFilter(option.target.value as FilterOptions)}
              defaultValue={filter}
              hideBorder
            />
          </Box>
        )}
      </Shelf>
      <ResponsiveContainer width="100%" height="100%" minHeight="200px">
        <AreaChart data={data || []} margin={{ top: 18, left: -10 }}>
          <defs>
            <linearGradient id="colorPoolValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.colors.textGold} stopOpacity={0.4} />
              <stop offset="95%" stopColor={theme.colors.textGold} stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            type="category"
            tickFormatter={(tick: number) => {
              if (data.length > 180) {
                return new Date(tick).toLocaleString('en-US', { month: 'short' })
              }
              return new Date(tick).toLocaleString('en-US', { day: 'numeric', month: 'short' })
            }}
            interval={(function interval() {
              if (filter === '30days') return 5
              if (filter === '90days') return 14
              if (filter === 'YTD' && data.length < 180) return 30
              return 45
            })()}
            style={{ fontSize: '10px', fill: theme.colors.textSecondary, letterSpacing: '-0.5px' }}
            tickLine={false}
            allowDuplicatedCategory={false}
          />
          {isPrice ? (
            <YAxis
              tickCount={6}
              dataKey="price"
              tickLine={false}
              style={{ fontSize: '10px', fill: theme.colors.textSecondary, letterSpacing: '-0.5px' }}
              tickFormatter={(tick: number) => {
                return tick.toFixed(6)
              }}
              domain={['dataMin - 0.001', 'dataMax + 0.001']}
              interval="preserveStartEnd"
            />
          ) : (
            <YAxis
              tickCount={6}
              dataKey="apy"
              tickLine={false}
              style={{ fontSize: '10px', fill: theme.colors.textSecondary, letterSpacing: '-0.5px' }}
              tickFormatter={(tick: number) => {
                return tick.toFixed(6)
              }}
              domain={['dataMin - 0.001', 'dataMax + 0.001']}
              interval="preserveStartEnd"
            />
          )}
          <CartesianGrid stroke={theme.colors.borderPrimary} />
          <Tooltip content={<CustomizedTooltip currency={currency} precision={6} isRate={!isPrice} />} />
          <Area
            type="monotone"
            dataKey={isPrice ? 'price' : 'apy'}
            strokeWidth={1}
            fillOpacity={1}
            fill="url(#colorPrice)"
            name={isPrice ? 'Price' : 'APY'}
            activeDot={{ fill: '#908f8f' }}
            stroke={theme.colors.textGold}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Stack>
  )
}
