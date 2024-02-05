import Decimal from 'decimal.js-light'
import * as React from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useDailyTVL } from '../../utils/usePools'

export type DataPoint = {
  dateInMilliseconds: number
  tvl: Decimal
}

type TotalValueLockedProps = {
  chainTVL: Decimal
  setHovered: (entry: DataPoint | undefined) => void
}

export default function TotalValueLocked({ chainTVL, setHovered }: TotalValueLockedProps) {
  const centrifugeTVL = useDailyTVL()
  const chartColor = '#ff8c00'

  const chartData = React.useMemo(() => {
    if (!centrifugeTVL) {
      return []
    }

    const currentTVL = chainTVL
      ? {
          dateInMilliseconds: new Date().setHours(0, 0, 0, 0),
          tvl: chainTVL,
        }
      : undefined

    const tvlSnapshots = centrifugeTVL.map((entry) => ({ ...entry, tvl: entry.tvl.toNumber() }))

    return [...tvlSnapshots, currentTVL]
  }, [centrifugeTVL, chainTVL])

  return (
    <ResponsiveContainer>
      <AreaChart
        data={chartData}
        margin={{ top: 0, left: 0, right: 0, bottom: 0 }}
        onMouseMove={(val: any) => {
          if (val?.activePayload && val?.activePayload.length > 0) {
            setHovered(val.activePayload[0].payload)
          }
        }}
        onMouseLeave={() => {
          setHovered(undefined)
        }}
      >
        <defs>
          <linearGradient id="colorPoolValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="tvl"
          strokeWidth={0}
          fillOpacity={1}
          fill="url(#colorPoolValue)"
          name="Current Value Locked"
          activeDot={{ fill: chartColor }}
        />
        <Tooltip content={<></>} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
