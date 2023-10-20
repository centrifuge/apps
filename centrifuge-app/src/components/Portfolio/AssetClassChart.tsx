import React from 'react'
import { Cell, Pie, PieChart as RechartsPieChart, Tooltip, TooltipProps } from 'recharts'
import { formatBalanceAbbreviated, formatPercentage } from '../../utils/formatting'
import { TooltipContainer, TooltipEntry, TooltipTitle } from '../Charts/CustomChartElements'

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
  if (payload && payload.length > 0) {
    return (
      <TooltipContainer>
        <TooltipTitle>{payload[0].name}</TooltipTitle>
        {payload.map(({ payload, name, value }) => (
          <TooltipEntry name={formatBalanceAbbreviated(value, currency)} color={payload.color} key={name}>
            {formatPercentage((value / total) * 100)}
          </TooltipEntry>
        ))}
      </TooltipContainer>
    )
  }
  return null
}
