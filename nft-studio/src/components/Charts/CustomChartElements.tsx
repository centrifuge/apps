import { Box, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { AreaProps, TooltipProps } from 'recharts'
import { useTheme } from 'styled-components'
import { formatDate } from '../../utils/date'
import { formatBalance, formatPercentage } from '../../utils/formatting'

type CustomizedXAxisTickProps = {
  payload?: { value: Date }
  variant: 'months' | 'days'
} & Pick<AreaProps, 'x'> &
  Pick<AreaProps, 'y'>

export const CustomizedXAxisTick: React.VFC<CustomizedXAxisTickProps> = ({ payload, x, y, variant }) => {
  let tick
  if (variant === 'months') {
    const formatter = new Intl.DateTimeFormat('en', { month: 'short' })
    // show month tick only on the first of every month
    tick = payload?.value && new Date(payload.value).getDate() === 1 ? formatter.format(payload?.value) : null
  } else {
    const formatter = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' })
    tick = formatter.format(payload?.value)
  }

  return (
    <g transform={`translate(${x},${y})`} style={{ fontSize: '10px', fontFamily: 'Inter' }}>
      <text x={0} y={0} dy={16} fontSize="10px" textAnchor="center">
        {tick}
      </text>
    </g>
  )
}

type CustomizedTooltipProps = TooltipProps<any, any> & { currency: string }

export const CustomizedTooltip: React.VFC<CustomizedTooltipProps> = ({ payload, currency }) => {
  const theme = useTheme()
  if (payload && payload?.length > 0) {
    return (
      <Stack
        bg="backgroundPage"
        p="1"
        style={{
          boxShadow: `1px 3px 6px ${theme.colors.borderSecondary}`,
        }}
        minWidth="180px"
        gap="4px"
      >
        <Text variant="label2" fontWeight="500">
          {formatDate(payload[0].payload.day)}
        </Text>
        {payload.map((item) => {
          return (
            <Shelf key={item.dataKey} gap="4px" justifyContent="space-between">
              <Shelf gap="4px" alignItems="center">
                <Box width="11px" height="11px" borderRadius="100%" backgroundColor={item.color} />
                <Text variant="label2">{item.name}</Text>
              </Shelf>
              <Text alignSelf="flex-end" textAlign="right" variant="label2">
                {typeof item.value !== 'number'
                  ? formatBalance(item.value[1] - item.value[0], currency)
                  : item.unit === 'percent'
                  ? formatPercentage(item.value)
                  : formatBalance(item.value, currency)}
              </Text>
            </Shelf>
          )
        })}
      </Stack>
    )
  }
  return null
}
