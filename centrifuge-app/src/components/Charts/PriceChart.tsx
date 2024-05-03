import { Box, Select, Shelf, Stack, Text } from '@centrifuge/fabric'
import React from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTheme } from 'styled-components'
import { Dec } from '../../utils/Decimal'
import { CustomizedTooltip } from './Tooltip'

export type FilterOptions = 'YTD' | '30days' | '90days'

type PriceChartProps = {
  data: { day: Date; price: number }[]
  currency: string
  filter?: FilterOptions
  setFilter?: React.Dispatch<React.SetStateAction<FilterOptions>>
}

export const PriceChart = ({ data, currency, filter, setFilter }: PriceChartProps) => {
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
            <Text variant="body3" color={priceDifference.gte(0) ? 'statusOk' : 'statusCritical'}>
              {' '}
              {priceDifference.gte(0) ? '+' : ''} {priceDifference.mul(100).toFixed(2)}%
            </Text>
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
            />
          </Box>
        )}
      </Shelf>
      <ResponsiveContainer width="100%" height="100%" minHeight="200px">
        <AreaChart data={data || []} margin={{ top: 18, left: -30 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={'#626262'} stopOpacity={0.4} />
              <stop offset="95%" stopColor={'#908f8f'} stopOpacity={0} />
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
          <YAxis
            tickCount={6}
            dataKey="price"
            tickLine={false}
            style={{ fontSize: '10px', fill: theme.colors.textSecondary, letterSpacing: '-0.5px' }}
            tickFormatter={(tick: number) => {
              return tick.toFixed(2)
            }}
            interval={'preserveStartEnd'}
          />
          <CartesianGrid stroke={theme.colors.borderPrimary} />
          <Tooltip content={<CustomizedTooltip currency={currency} precision={4} />} />
          <Area
            type="monotone"
            dataKey="price"
            strokeWidth={1}
            fillOpacity={1}
            fill="url(#colorPrice)"
            name="Price"
            activeDot={{ fill: '#908f8f' }}
            stroke="#908f8f"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Stack>
  )
}
