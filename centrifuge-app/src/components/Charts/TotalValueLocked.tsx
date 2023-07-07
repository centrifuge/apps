import { Box, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useQuery } from 'react-query'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Dec } from '../../utils/Decimal'
import { getTinlakeSubgraphTVL } from '../../utils/tinlake/getTinlakeSubgraphTVL'
import { useListedPools } from '../../utils/useListedPools'
import { useDailyTVL } from '../../utils/usePools'

export function TotalValueLocked() {
  const centrifugePools = useDailyTVL()
  const tinlakePools = useDailyTinlakeTVL()
  const [listedTokens] = useListedPools()

  const totalValueLocked = React.useMemo(() => {
    return listedTokens
      ? listedTokens
          .filter((token) => token.tranches)
          .map((token) => token.tranches)
          .flat()
          .map((tranche) =>
            tranche.totalIssuance
              .toDecimal()
              .mul(tranche.tokenPrice?.toDecimal() ?? Dec(0))
              .toNumber()
          )
          .reduce((prev, curr) => prev.add(curr), Dec(0)) ?? Dec(0)
      : Dec(0)
  }, [listedTokens])

  const chartData = React.useMemo(() => {
    return totalValueLocked && tinlakePools && centrifugePools
      ? [
          // {
          //   dateInMilliseconds: new Date().setHours(0, 0, 0, 0),
          //   poolTVL: totalValueLocked,
          // },
          ...tinlakePools,
          ...centrifugePools,
        ]
          .map((entry) => ({ ...entry, poolTVL: entry.poolTVL.toNumber() }))
          .sort((a, b) => a.dateInMilliseconds - b.dateInMilliseconds)
      : []
  }, [tinlakePools, centrifugePools, totalValueLocked])

  console.log('chartData', chartData)

  return (
    <Box>
      <Text>Total value locked chart</Text>
      <Box height={800} flex="1 0 130px">
        <ResponsiveContainer>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorPoolValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0828BE" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#0828BE" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip />
            <XAxis
              type="number"
              domain={['dataMin', 'dataMax']}
              dataKey="dateInMilliseconds"
              tickFormatter={(tick) => new Date(tick).toLocaleDateString()}
            />
            <YAxis type="number" domain={['dataMin', 'dataMax']} />
            <Area
              type="monotone"
              dataKey="poolTVL"
              stroke="#0828BE"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPoolValue)"
              name="Current Value Locked"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  )
}

function useDailyTinlakeTVL() {
  const { data } = useQuery('use daily tinlake tvl', getTinlakeSubgraphTVL, {
    staleTime: Infinity,
    suspense: true,
  })

  return data
}
