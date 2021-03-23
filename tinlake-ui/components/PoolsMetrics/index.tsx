import { baseToDisplay } from '@centrifuge/tinlake-js'
import { Box, Button } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts'
import { PoolsDailyData, PoolsData } from '../../ducks/pools'
import { maybeLoadRewards, RewardsState } from '../../ducks/rewards'
import { dateToYMD } from '../../utils/date'
import { dynamicPrecision } from '../../utils/toDynamicPrecision'
import NumberDisplay from '../NumberDisplay'
import { Cont, Label, TokenLogo, Unit, Value } from './styles'

interface Props {
  pools: PoolsData
}

const PoolsMetrics: React.FC<Props> = (props: Props) => {
  const router = useRouter()
  const poolsDailyData = useSelector<any, PoolsDailyData[]>((state) => state.pools.poolsDailyData)

  const [hoveredPoolValue, setHoveredPoolValue] = React.useState<number | undefined>(undefined)
  const [hoveredDay, setHoveredDay] = React.useState<number | undefined>(undefined)

  const rewards = useSelector<any, RewardsState>((state: any) => state.rewards)
  const dispatch = useDispatch()
  React.useEffect(() => {
    dispatch(maybeLoadRewards())
  }, [])

  const totalRewardsEarned = baseToDisplay(rewards.data?.toDateRewardAggregateValue || '0', 18)

  const maxPoolValue = Math.max.apply(
    Math,
    poolsDailyData.map((o) => {
      return o.poolValue
    })
  )

  const goToRewards = () => router.push('/rewards')

  return (
    <>
      {router.query.showAll && (
        <Box
          width="256px"
          pad="medium"
          elevation="small"
          round="xsmall"
          background="white"
          margin={{ horizontal: '16px' }}
        >
          <Cont>
            <Value>{props.pools.ongoingLoans}</Value>
          </Cont>
          <Label>Assets Locked</Label>
        </Box>
      )}
      <Box
        width="460px"
        elevation="small"
        round="xsmall"
        background="white"
        margin={{ horizontal: '16px' }}
        direction="row"
        pad="medium"
      >
        <Box pad={{ top: '8px' }} width="200px">
          <Cont>
            <TokenLogo src={`/static/dai.svg`} />
            <Value>
              <NumberDisplay
                value={hoveredPoolValue?.toString() || baseToDisplay(props.pools.totalValue, 18)}
                precision={0}
              />
            </Value>{' '}
            <Unit>DAI</Unit>
          </Cont>
          <Label>{hoveredDay ? `TVL on ${dateToYMD(hoveredDay)}` : 'Total Value Locked'}</Label>
        </Box>
        <Box
          width="200px"
          height="80px"
          pad={{ left: 'medium' }}
          margin={{ left: 'medium' }}
          style={{ borderLeft: '1px solid #D8D8D8' }}
        >
          <ResponsiveContainer>
            <AreaChart
              data={poolsDailyData}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              onMouseMove={(val: any) => {
                if (val.activePayload) {
                  setHoveredPoolValue(val.activePayload[0].payload.poolValue)
                  setHoveredDay(val.activePayload[0].payload.day)
                }
              }}
              onMouseLeave={() => {
                setHoveredPoolValue(undefined)
                setHoveredDay(undefined)
              }}
            >
              <defs>
                <linearGradient id="colorPoolValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0828BE" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0828BE" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip content={<></>} />
              <YAxis type="number" domain={[0, maxPoolValue]} hide />
              {/* <XAxis dataKey="day" mirror tickFormatter={(val: number) => dateToYMD(val)} /> */}
              <Area
                type="monotone"
                dataKey="poolValue"
                stroke="#0828BE"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPoolValue)"
                name="Current Value Locked (DAI)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Box>
      <Box
        width="430px"
        elevation="small"
        round="xsmall"
        background="white"
        margin={{ horizontal: '16px' }}
        direction="row"
        pad="medium"
        justify="center"
      >
        <Box>
          <Cont style={{ marginTop: '8px' }}>
            <TokenLogo src={`/static/rad.svg`} />
            <Value>
              <NumberDisplay value={totalRewardsEarned} precision={dynamicPrecision(totalRewardsEarned)} />
            </Value>{' '}
            <Unit>RAD</Unit>
          </Cont>
          <Label>Total Rewards Earned</Label>
        </Box>
        <Box margin={{ left: 'medium' }} justify="center">
          <Button label="Claim Rewards" primary onClick={goToRewards} color="#FCBA59" />
        </Box>
      </Box>
    </>
  )
}

export default PoolsMetrics
