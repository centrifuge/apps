import { baseToDisplay } from '@centrifuge/tinlake-js'
import { Box } from 'grommet'
import { WithRouterProps } from 'next/dist/client/with-router'
import { useRouter, withRouter } from 'next/router'
import * as React from 'react'
import { PoolsDailyData, PoolsData } from '../../ducks/pools'
import NumberDisplay from '../NumberDisplay'
import { Cont, Label, TokenLogo, Unit, Value } from './styles'
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts'
import { useSelector } from 'react-redux'
import {
  ChartTooltip,
  ChartTooltipColor,
  ChartTooltipKey,
  ChartTooltipLine,
  ChartTooltipTitle,
  ChartTooltipValue,
} from '../../components/Chart/styles'
import { dateToYMD } from '../../utils/date'
import { addThousandsSeparators } from '../../utils/addThousandsSeparators'

interface Props extends WithRouterProps {
  pools: PoolsData
}

const PoolsMetrics: React.FC<Props> = (props: Props) => {
  const router = useRouter()
  const poolsDailyData = useSelector<any, PoolsDailyData[]>((state) => state.pools.poolsDailyData)
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
        <Box pad={{ top: 'small' }}>
          <Cont>
            <TokenLogo src={`/static/dai.svg`} />
            <Value>
              <NumberDisplay value={baseToDisplay(props.pools.totalValue, 18)} precision={0} />
            </Value>{' '}
            <Unit>DAI</Unit>
          </Cont>
          <Label>Current Value Locked</Label>
        </Box>
        <Box
          width="200px"
          height="80px"
          pad={{ left: 'medium' }}
          margin={{ left: 'medium' }}
          style={{ borderLeft: '1px solid #D8D8D8' }}
        >
          <ResponsiveContainer>
            <AreaChart data={poolsDailyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPoolValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0828BE" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0828BE" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip content={<CustomTooltip />} offset={20} />
              {/* <XAxis dataKey="day" mirror tickFormatter={(val: number) => dateToYMDShort(val)} /> */}
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
        <Cont>
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

const CustomTooltip = ({ active, payload }: any) => {
  return active && payload ? (
    <ChartTooltip>
      <ChartTooltipTitle>{dateToYMD(payload[0].payload.day)}</ChartTooltipTitle>
      <ChartTooltipLine>
        <ChartTooltipKey>
          <ChartTooltipColor color="#0828BE" /> Current Value Locked:
        </ChartTooltipKey>
        <ChartTooltipValue>{addThousandsSeparators(payload[0].value)} DAI</ChartTooltipValue>
      </ChartTooltipLine>
    </ChartTooltip>
  ) : (
    <>&nbsp;</>
  )
}
