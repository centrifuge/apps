import BN from 'bn.js'
import React, { useMemo } from 'react'
import { Cell, Pie, PieChart, PieLabelRenderProps } from 'recharts'
import styled from 'styled-components'
import { Stack } from '../Layout'
import { useRwaContext } from './RwaContextProvider'
import { assetsList } from './uiConfig'

const COLORS = [
  // '#FAFBFF',
  // '#F0F4FF',
  '#DBE5FF',
  '#B3C8FF',
  '#7A9FFF',
  '#4C7EFF',
  '#1253FF',
  '#003CDB',
  '#002B9E',
  '#001C66',
]

const RADIAN = Math.PI / 180

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, payload }: PieLabelRenderProps) => {
  // @ts-ignore
  const radius = innerRadius + (outerRadius - innerRadius) * 1.1 // @ts-ignore
  const x = cx + radius * Math.cos(-midAngle * RADIAN) // @ts-ignore
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    // @ts-ignore
    <text
      x={x}
      y={y}
      fill="black"
      textAnchor={x > (cx || 0) ? 'start' : 'end'}
      dominantBaseline="central"
      fontWeight="500"
      fontSize="10px"
    >
      {payload.name}
    </text>
  )
}

export const TokenDistribution: React.FC = () => {
  const { reserves } = useRwaContext()
  const tokenReserves = reserves?.filter((res) => res.symbol !== 'USDC')

  const chartData = tokenReserves?.map((res) => ({
    name: res.symbol,
    value:
      parseFloat(res.totalCurrentVariableDebt) || 1e-18 /*  || 1e-18 is a fix to show chart if all the values are 0 */,
  }))

  const totalBorrowedBN = useMemo<BN>(() => {
    if (!tokenReserves) return new BN(0)
    return tokenReserves.reduce((acc, res) => acc.add(new BN(res.totalCurrentVariableDebt)), new BN(0))
  }, [tokenReserves])

  return (
    <Stack gap="24px">
      <Title>Token distribution</Title>

      <PieChart width={400} height={230}>
        <Pie
          dataKey="value"
          data={chartData}
          cx="50%"
          cy="50%"
          outerRadius={90}
          fill="#8884d8"
          label={renderCustomizedLabel}
          labelLine={false}
          legendType="none"
          onMouseOver={() => {}}
        >
          {chartData?.map((item, index) => (
            <Cell key={item.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
      <TokenList>
        {tokenReserves?.map((res) => (
          <TokenListItem key={res.symbol}>
            <TokenIcon src={assetsList.find((a) => a.symbol === res.symbol)?.icon} />
            <SymbolId>{res.symbol}</SymbolId>
            <BodyText>{res.name}</BodyText>
            <TokenListItemVal>{res.totalCurrentVariableDebt}</TokenListItemVal>
          </TokenListItem>
        ))}
        <TokenListItem>
          <SymbolId>Total borrowed</SymbolId>
          <TokenListItemVal>{totalBorrowedBN.toString()}</TokenListItemVal>
        </TokenListItem>
      </TokenList>
    </Stack>
  )
}

const TokenList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`
const TokenListItem = styled.li`
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #e0e0e0;
  height: 48px;
`

const SymbolId = styled.span`
  font-weight: 600;
  font-size: 14px;
  line-height: 137.5%;
  min-width: 96px;
`

const TokenIcon = styled.img`
  width: 24px;
  height: 24px;
`

const Title = styled.span`
  font-weight: 600;
  font-size: 16px;
  line-height: 22px;
`

const BodyText = styled.span`
  font-weight: 400;
  font-size: 14px;
  line-height: 19.25px;
`

const TokenListItemVal = styled(BodyText)`
  flex-grow: 1;
  text-align: right;
`
