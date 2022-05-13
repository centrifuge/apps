import React from 'react'
import { Cell, Pie, PieChart as RechartsPieChart, PieLabelRenderProps } from 'recharts'
import { useTheme } from 'styled-components'

type PieChartProps = {
  data: { name: string; value: number; color?: string }[]
}

const RADIAN = Math.PI / 180

export const RiskGroupSharesPieChart: React.VFC<PieChartProps> = ({ data }) => {
  const theme = useTheme()
  const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent, payload }: PieLabelRenderProps) => {
    const outerLabelRadius = (outerRadius as number) * 0.5 + 60
    const xOuter = (cx as number) + outerLabelRadius * Math.cos(-midAngle * RADIAN)
    const yOuter = (cy as number) + outerLabelRadius * Math.sin(-midAngle * RADIAN)
    const innerLabelRadius = (outerRadius as number) * 0.5 + 5
    const xInner = (cx as number) + innerLabelRadius * Math.cos(-midAngle * RADIAN)
    const yInner = (cy as number) + innerLabelRadius * Math.sin(-midAngle * RADIAN)
    return (
      <>
        {percent && percent > 0.03 && (
          <>
            <text
              x={xOuter}
              y={yOuter}
              fill={theme.colors.textSecondary}
              textAnchor={xOuter > (cx as number) ? 'start' : 'end'}
              dominantBaseline="central"
              fontSize="10"
            >
              {payload.name}
            </text>
            <text
              x={xInner}
              y={yInner}
              fill={payload.labelColor}
              textAnchor={xInner > (cx as number) ? 'start' : 'end'}
              dominantBaseline="central"
              fontSize="10"
            >
              {`${(percent * 100).toFixed(0)}%`}
            </text>
          </>
        )}
      </>
    )
  }

  return (
    <RechartsPieChart width={300} height={250} style={{ fontFamily: 'Inter' }}>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        label={renderCustomizedLabel}
        labelLine={false}
        outerRadius={88}
        dataKey="value"
        isAnimationActive={false}
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
