import { Shelf, Text } from '@centrifuge/fabric'
import React from 'react'
import { Cell, Pie, PieChart as RechartsPieChart, Tooltip, TooltipProps } from 'recharts'
import { formatBalanceAbbreviated, formatPercentage } from '../../utils/formatting'
import { TooltipContainer } from '../Charts/CustomChartElements'

type PieChartProps = {
  data: { name: string; value: number; color?: string }[]
  currency: string
  total: number
}

export function AssetClassChart({ data, currency, total }: PieChartProps) {
  return (
    <RechartsPieChart width={150} height={150} style={{ fontFamily: 'Inter' }}>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        outerRadius={72}
        innerRadius={36}
        dataKey="value"
        nameKey="name"
        startAngle={-270}
      >
        {data.map((item, index) => (
          <Cell
            key={`cell-${item.color}-${index}`}
            fill={item?.color || 'transparent'}
            stroke={item?.color! || 'transparent'}
          />
        ))}
      </Pie>
      <Tooltip content={<TooltipContent currency={currency} total={total} />} />
    </RechartsPieChart>
  )
}

function TooltipContent({ payload, currency, total }: TooltipProps<any, any> & { currency: string; total: number }) {
  console.log('payload', payload, total)
  if (payload && payload.length > 0) {
    return (
      <TooltipContainer>
        <Text variant="body2">{payload[0].name}</Text>
        <Shelf justifyContent="space-between">
          <Text variant="heading3">{formatBalanceAbbreviated(payload[0].value, currency)}</Text>

          <Text variant="body2">{formatPercentage((payload[0].value / total) * 100)}</Text>
        </Shelf>
      </TooltipContainer>
    )
  }
  return null
}
