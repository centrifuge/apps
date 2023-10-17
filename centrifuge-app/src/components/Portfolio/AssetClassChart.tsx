import React from 'react'
import { Cell, Pie, PieChart as RechartsPieChart } from 'recharts'

type PieChartProps = {
  data: { name: string; value: number; color?: string }[]
}

export function AssetClassChart({ data }: PieChartProps) {
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
    </RechartsPieChart>
  )
}
