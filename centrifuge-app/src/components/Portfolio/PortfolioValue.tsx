import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts'

export type DataPoint = {
  dateInMilliseconds: number
}

type TotalValueLockedProps = {
  setHovered: (entry: DataPoint | undefined) => void
}

export function PortfolioValue({ setHovered }: TotalValueLockedProps) {
  // const portfolioValue = usePortfolioValue()
  const chartColor = '#006EF5'

  // const chartData = React.useMemo(
  //   () => {
  //     return []
  //   },
  //   [ portfolioValue ]
  // )

  return (
    <ResponsiveContainer>
      <AreaChart
        margin={{
          top: 50,
          right: 30,
          left: 30,
          bottom: 0,
        }}
        data={[
          {
            portfolioValue: 123809,
            dateInMilliseconds: Date.now(),
            // month: <Text variant="body4">Jan</Text>,
            month: 'Jan',
          },
          {
            portfolioValue: 123809,
            dateInMilliseconds: Date.now() - 86400000, // 1 day ago
            month: 'Feb',
          },
          {
            portfolioValue: 123809,
            dateInMilliseconds: Date.now() - 86400000 * 2, // 2 days ago
            month: 'Mar',
          },
          {
            portfolioValue: 2023480,
            dateInMilliseconds: Date.now() - 86400000 * 3, // 3 days ago
            month: 'Apr',
          },
          {
            portfolioValue: 3023480,
            dateInMilliseconds: Date.now() - 86400000 * 4, // 4 days ago
            month: 'May',
          },
          {
            portfolioValue: 4023480,
            dateInMilliseconds: Date.now() - 86400000 * 5, // 5 days ago
            month: 'Jun',
          },
          {
            portfolioValue: 7023480,
            dateInMilliseconds: Date.now() - 86400000 * 6, // 6 days ago
            month: 'Jul',
          },
          {
            portfolioValue: 8023480,
            dateInMilliseconds: Date.now() - 86400000 * 7, // 7 days ago
            month: 'Aug',
          },
          {
            portfolioValue: 9023480,
            dateInMilliseconds: Date.now() - 86400000 * 8, // 8 days ago
            month: 'Sep',
          },
          {
            portfolioValue: 10023480,
            dateInMilliseconds: Date.now() - 86400000 * 9, // 9 days ago
            month: 'Oct',
          },
          {
            portfolioValue: 11023480,
            dateInMilliseconds: Date.now() - 86400000 * 10, // 10 days ago
            month: 'Nov',
          },
          {
            portfolioValue: 12023480,
            dateInMilliseconds: Date.now() - 86400000 * 11, // 11 days ago
            month: 'Dec',
          },
        ]}
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
            <stop offset="0" stopColor={chartColor} stopOpacity={0.3} />
            <stop offset="90%" stopColor="#F2F2F2" stopOpacity={0.8} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />

        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis dataKey="portfolioValue" tickCount={10} tickLine={false} axisLine={false} />
        <Area
          type="monotone"
          dataKey="portfolioValue"
          strokeWidth={1}
          fillOpacity={1}
          fill="url(#colorPoolValue)"
          name="Current Value Locked"
          stroke={`${chartColor}30`}
          activeDot={{ fill: chartColor }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// function getMergedData(combined: DataPoint[], current?: DataPoint) {
//   const mergedMap = new Map()

//   combined.forEach((entry) => {
//     const { dateInMilliseconds, tvl } = entry

//     if (mergedMap.has(dateInMilliseconds)) {
//       mergedMap.set(dateInMilliseconds, mergedMap.get(dateInMilliseconds).add(tvl))
//     } else {
//       mergedMap.set(dateInMilliseconds, tvl)
//     }
//   })

//   if (current) {
//     mergedMap.set(current.dateInMilliseconds, current.tvl)
//   }

//   const merged = Array.from(mergedMap, ([dateInMilliseconds, tvl]) => ({ dateInMilliseconds, tvl }))
//     .sort((a, b) => a.dateInMilliseconds - b.dateInMilliseconds)
//     .map((entry) => ({ ...entry, tvl: entry.tvl.toNumber() }))

//   return merged
// }
