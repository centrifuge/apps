import { baseToDisplay, ITinlake } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Button } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip as ChartTooltip, YAxis } from 'recharts'
import styled from 'styled-components'
import { dateToYMD } from '../../utils/date'
import { useCFGYield } from '../../utils/hooks'
import { useDailyTVL } from '../../utils/useDailyTVL'
import { useMedia } from '../../utils/useMedia'
import { Card } from '../Card'
import { Divider } from '../Divider'
import { Box, Center, Shelf, Stack } from '../Layout'
import NumberDisplay from '../NumberDisplay'
import { Tooltip } from '../Tooltip'
import { ValueDisplay } from '../ValueDisplay'

interface Props {
  totalValue: BN
  tinlake: ITinlake
}

const PoolsMetrics: React.FC<Props> = (props: Props) => {
  const router = useRouter()
  const { data: dailyTVL = [] } = useDailyTVL()
  const isMobile = useMedia({ below: 'medium' })

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

  const TVLElement = (
    <Shelf justifyContent="center" p="medium" gap="xlarge" flexWrap={['wrap', 'nowrap']}>
      <Box height={80} flex="1 0 130px">
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
      <TVLDisplay>
        {/*
          Rendering the TVL twice. Always rendering the total value invisibly to fix the width of the element.
          This way we can stretch the graph without it changing width when the TVL changes on hover.
        */}
        <ValueDisplay
          icon="/static/dai.svg"
          value={<NumberDisplay value={baseToDisplay(props.totalValue || new BN(0), 18)} precision={0} />}
          unit="DAI"
        />
        <ValueDisplay
          icon="/static/dai.svg"
          value={
            <NumberDisplay
              value={hoveredPoolValue?.toString() || baseToDisplay(props.totalValue || new BN(0), 18)}
              precision={0}
            />
          }
          unit="DAI"
          label={hoveredDay ? `TVL on ${dateToYMD(hoveredDay)}` : 'Total Value Locked'}
        />
      </TVLDisplay>
    </Shelf>
  )

  const APRElement = (
    <Shelf p="medium" gap="xlarge" flexDirection={['column', 'row']} alignSelf="center">
      <Stack alignItems="center">
        <ValueDisplay
          icon="/static/cfg-white.svg"
          value={cfgYield && <NumberDisplay value={cfgYield as string} precision={2} />}
          unit="%"
          label={
            <Tooltip
              title="Tinlake investments earns daily rewards in Centrifuge's native token (CFG). The CFG reward rate is an annualized representation of these rewards based on the current CFG token price. Rewards are independent from the pool's issuer and not guaranteed - please see Investment disclaimer for more details."
              underline
            >
              Reward Rate (APR)
            </Tooltip>
          }
        />
      </Stack>
      <Box display={['none', 'block']}>
        <Button label="Claim CFG" primary onClick={goToRewards} />
      </Box>
    </Shelf>
  )

  return isMobile ? (
    <Stack as={Card}>
      {TVLElement}
      <Divider />
      {APRElement}
    </Stack>
  ) : (
    <Shelf gap="medium" alignItems="stretch" justifyContent="center">
      <Card flex="1 1 300px" maxWidth="440px">
        {TVLElement}
      </Card>
      <Card flex="1 1 300px" maxWidth="440px" as={Center}>
        {APRElement}
      </Card>
    </Shelf>
  )
}

const TVLDisplay = styled('div')`
  flex: 0;
  display: grid;
  grid-template-columns: 100%;
  grid-template-rows: auto;
  grid-template-areas: 'unit';
  position: relative;

  > div {
    grid-area: unit;
    align-self: center;
    justify-self: center;
  }

  > div:first-child {
    visibility: hidden;
    pointer-events: none;
  }
`

export default PoolsMetrics
