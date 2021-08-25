import { baseToDisplay, ITinlake } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box, Button } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip as ChartTooltip, YAxis } from 'recharts'
import { dateToYMD } from '../../utils/date'
import { useCFGYield } from '../../utils/hooks'
import { useDailyTVL } from '../../utils/useDailyTVL'
import { LoadingValue } from '../LoadingValue'
import NumberDisplay from '../NumberDisplay'
import { Tooltip } from '../Tooltip'
import { Label, Unit, Value, ValueIcon, ValueWrapper } from './styles'

interface Props {
  totalValue?: BN
  tinlake: ITinlake
}

const PoolsMetrics: React.FC<Props> = (props: Props) => {
  const router = useRouter()
  const { data: dailyTVL = [] } = useDailyTVL()

  const [hoveredPoolValue, setHoveredPoolValue] = React.useState<number | undefined>(undefined)
  const [hoveredDay, setHoveredDay] = React.useState<number | undefined>(undefined)

  const cfgYield = useCFGYield(props.tinlake)

  const maxPoolValue = Math.max.apply(
    Math,
    dailyTVL.map((o) => {
      return o.poolValue
    })
  )

  const goToRewards = () => router.push('/rewards')

  return (
    <>
      <Box
        elevation="small"
        round="xsmall"
        background="white"
        margin={{ horizontal: '16px' }}
        style={{ flex: '1 1 300px', maxWidth: '440px' }}
        direction="row"
        pad="medium"
      >
        <Box width="250px" height="80px" pad={{ left: 'small' }} margin={{ left: '0' }}>
          <ResponsiveContainer>
            <AreaChart
              data={dailyTVL}
              margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
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
              <ChartTooltip content={<></>} />
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
        <Box
          width="370px"
          pad={{ left: 'medium', top: '8px' }}
          margin={{ left: 'medium' }}
          style={{ borderLeft: '1px solid #D8D8D8' }}
        >
          <ValueWrapper>
            <ValueIcon src={`/static/dai.svg`} />
            <Value>
              <NumberDisplay
                value={hoveredPoolValue?.toString() || baseToDisplay(props.totalValue || new BN(0), 18)}
                precision={0}
              />{' '}
              <Unit>DAI</Unit>
            </Value>
          </ValueWrapper>
          <Label>{hoveredDay ? `TVL on ${dateToYMD(hoveredDay)}` : 'Total Value Locked'}</Label>
        </Box>
      </Box>
      <Box
        elevation="small"
        round="xsmall"
        background="white"
        margin={{ horizontal: '16px' }}
        style={{ flex: '1 1 300px', maxWidth: '440px' }}
        direction="row"
        pad="medium"
        justify="center"
      >
        <Box>
          <>
            <ValueWrapper style={{ marginTop: '8px' }}>
              <ValueIcon src={`/static/cfg-white.svg`} />
              <LoadingValue done={!!cfgYield} width={75} height={28}>
                <Value>
                  <NumberDisplay value={cfgYield as string} precision={2} /> <Unit>%</Unit>
                </Value>
              </LoadingValue>
            </ValueWrapper>

            <Tooltip
              title="Tinlake investments earns daily rewards in Centrifuge's native token (CFG). The CFG reward rate is an annualized representation of these rewards based on the current CFG token price. Rewards are independent from the pool's issuer and not guaranteed - please see Investment disclaimer for more details."
              underline
            >
              <Label>Reward Rate (APR)</Label>
            </Tooltip>
          </>
        </Box>
        <Box margin={{ left: 'large' }} justify="center">
          <Button label="Claim CFG" primary onClick={goToRewards} />
        </Box>
      </Box>
    </>
  )
}

export default PoolsMetrics
