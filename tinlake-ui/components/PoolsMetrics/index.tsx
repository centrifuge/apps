import { baseToDisplay } from '@centrifuge/tinlake-js'
import { Box } from 'grommet'
import { useRouter } from 'next/router'
import * as React from 'react'
import { PoolsDailyData, PoolsData } from '../../ducks/pools'
import NumberDisplay from '../NumberDisplay'
import { Cont, Label, TokenLogo, Unit, Value } from './styles'
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts'
import { useSelector } from 'react-redux'
import { dateToYMD } from '../../utils/date'

interface Props {
  pools: PoolsData
}

const PoolsMetrics: React.FC<Props> = (props: Props) => {
  const router = useRouter()
  const poolsDailyData = useSelector<any, PoolsDailyData[]>((state) => state.pools.poolsDailyData)

  const [hoveredPoolValue, setHoveredPoolValue] = React.useState<number | undefined>(undefined)
  const [hoveredDay, setHoveredDay] = React.useState<number | undefined>(undefined)

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
          <Label>{hoveredDay ? `Value Locked on ${dateToYMD(hoveredDay)}` : 'Current Value Locked'}</Label>
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
        width="256px"
        pad="medium"
        elevation="small"
        round="xsmall"
        background="white"
        margin={{ horizontal: '16px' }}
      >
        <Cont style={{ marginTop: '8px' }}>
          <TokenLogo src={`/static/dai.svg`} />
          <Value>
            <NumberDisplay value={baseToDisplay(props.pools.totalFinancedCurrency, 18)} precision={0} />
          </Value>{' '}
          <Unit>DAI</Unit>
        </Cont>
        <Label>Total Financed to Date</Label>
      </Box>
    </>
  )
}

export default PoolsMetrics
