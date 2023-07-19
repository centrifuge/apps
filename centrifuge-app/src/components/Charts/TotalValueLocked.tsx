import Decimal from 'decimal.js-light'
import * as React from 'react'
import { useQuery } from 'react-query'
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts'
import { getTinlakeSubgraphTVL } from '../../utils/tinlake/getTinlakeSubgraphTVL'
import { useDailyTVL } from '../../utils/usePools'

export type DataPoint = {
  dateInMilliseconds: number
  tvl: Decimal
}

type TotalValueLockedProps = {
  chainTVL: Decimal
  setHovered: (entry: DataPoint | undefined) => void
}

export function TotalValueLocked({ chainTVL, setHovered }: TotalValueLockedProps) {
  const centrifugeTVL = useDailyTVL()
  const tinlakeTVL = useDailyTinlakeTVL()
  const chartColor = '#ff8c00'

  const chartData = React.useMemo(() => {
    if (!tinlakeTVL || !centrifugeTVL) {
      return []
    }

    const currentTVL = chainTVL
      ? {
          dateInMilliseconds: new Date().setHours(0, 0, 0, 0),
          tvl: chainTVL,
        }
      : undefined

    return getMergedData([...tinlakeTVL, ...centrifugeTVL], currentTVL)
  }, [tinlakeTVL, centrifugeTVL, chainTVL])

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

function useDailyTinlakeTVL() {
  const { data } = useQuery('use daily tinlake tvl', getTinlakeSubgraphTVL, {
    staleTime: Infinity,
    suspense: true,
  })

  return data
}

function getMergedData(combined: DataPoint[], current?: DataPoint) {
  const mergedMap = new Map()

  combined.forEach((entry) => {
    const { dateInMilliseconds, tvl } = entry

    if (mergedMap.has(dateInMilliseconds)) {
      mergedMap.set(dateInMilliseconds, mergedMap.get(dateInMilliseconds).add(tvl))
    } else {
      mergedMap.set(dateInMilliseconds, tvl)
    }
  })

  if (current) {
    mergedMap.set(current.dateInMilliseconds, current.tvl)
  }

  const merged = Array.from(mergedMap, ([dateInMilliseconds, tvl]) => ({ dateInMilliseconds, tvl }))
    .sort((a, b) => a.dateInMilliseconds - b.dateInMilliseconds)
    .map((entry) => ({ ...entry, tvl: entry.tvl.toNumber() }))

  return merged
}
