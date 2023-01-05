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
  const theme = useTheme()
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
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} fontSize="10px" fill={theme.colors.textSecondary} textAnchor="center">
        {tick}
      </text>
    </g>
  )
}

type CustomizedTooltipProps = TooltipProps<any, any> & { currency: string; precision?: number }

export const CustomizedTooltip: React.VFC<CustomizedTooltipProps> = ({ payload, currency, precision }) => {
  const theme = useTheme()
  if (payload && payload?.length > 0) {
    return (
      <TooltipContainer>
        <TooltipTitle>{formatDate(payload[0].payload.day)}</TooltipTitle>
        {payload.map(({ dataKey, name, color, value, unit }, index) => (
          <TooltipEntry name={name} color={color} key={`${dataKey}${index}`}>
            {typeof value !== 'number'
              ? formatBalance(value[1] - value[0], currency, precision)
              : unit === 'percent'
              ? formatPercentage(value)
              : formatBalance(value, currency, precision)}
          </TooltipEntry>
        ))}
      </TooltipContainer>
    )
  }
  return null
}

export function TooltipContainer({ children }: { children: React.ReactNode }) {
  return (
    <Stack
      bg="backgroundPage"
      p={1}
      style={{
        boxShadow: '1px 3px 6px rgba(0, 0, 0, .15)',
      }}
      minWidth="180px"
      gap="4px"
    >
      {children}
    </Stack>
  )
}

export function TooltipTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text variant="label2" fontWeight="500">
      {children}
    </Text>
  )
}

export function TooltipEntry({ name, color, children }: { name: string; color?: string; children: React.ReactNode }) {
  return (
    <Shelf gap="4px" justifyContent="space-between">
      <Shelf gap="4px" alignItems="center">
        <Box width="11px" height="11px" borderRadius="100%" backgroundColor={color} />
        <Text variant="label2">{name}</Text>
      </Shelf>
      <Text alignSelf="flex-end" textAlign="right" variant="label2">
        {children}
      </Text>
    </Shelf>
  )
}
