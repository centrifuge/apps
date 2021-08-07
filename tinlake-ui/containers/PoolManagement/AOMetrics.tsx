import { baseToDisplay } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box, Heading } from 'grommet'
import * as React from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import { Pool } from '../../config'
import { LoansState, SortableLoan } from '../../ducks/loans'
import { PoolData, PoolState } from '../../ducks/pool'
import { addThousandsSeparators } from '../../utils/addThousandsSeparators'
import { toPrecision } from '../../utils/toPrecision'

interface Props {
  activePool: Pool
}

const e18 = new BN(10).pow(new BN(18))

const parseRatio = (num: BN): number => {
  const base = new BN(10).pow(new BN(20))
  return num.div(base).toNumber() / 10 ** 7
}

const AOMetrics: React.FC<Props> = (props: Props) => {
  const pool = useSelector<any, PoolState>((state) => state.pool)
  const poolData = pool?.data as PoolData | undefined
  const loans = useSelector<any, LoansState>((state) => state.loans)

  const totalOutstanding = loans?.loans
    ? loans?.loans
        .filter((loan) => loan.status && loan.status === 'ongoing')
        .reduce((prev: BN, loan: SortableLoan) => {
          return prev.add(loan.debt)
        }, new BN(0))
    : new BN(0)

  const minJuniorRatio = poolData ? parseRatio(poolData.minJuniorRatio) : undefined
  const currentJuniorRatio = poolData ? parseRatio(poolData.currentJuniorRatio) : undefined

  const reserveRatio =
    poolData && !poolData.reserve.add(poolData.netAssetValue).isZero()
      ? poolData.reserve
          .mul(e18)
          .div(poolData.reserve.add(poolData.netAssetValue))
          .div(new BN('10').pow(new BN('14')))
      : new BN(0)

  return (
    <Card
      elevation="small"
      round="xsmall"
      background="white"
      direction="row"
      justify="between"
      gap="medium"
      pad="medium"
      style={{ zIndex: 3 }}
    >
      <HeaderBox margin={{ left: 'medium' }} style={{ borderRight: 'none' }}>
        <Heading level="4">
          {addThousandsSeparators(toPrecision(baseToDisplay(totalOutstanding, 18), 0))}
          <Unit>{props.activePool.metadata.currencySymbol}</Unit>
        </Heading>
        <Type>Total Outstanding Debt</Type>
      </HeaderBox>
      <HeaderBox>
        <Heading level="4">
          {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.netAssetValue || new BN(0), 18), 0))}
          <Unit>{props.activePool.metadata.currencySymbol}</Unit>
        </Heading>
        <Type>Asset Value (NAV)</Type>
      </HeaderBox>
      <HeaderBox style={{ borderRight: 'none' }} width="120px">
        <Heading level="4">
          {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.reserve || new BN(0), 18), 0))}
          <Unit>{props.activePool.metadata.currencySymbol}</Unit>
        </Heading>
        <Type>Reserve</Type>
      </HeaderBox>
      <HeaderBox width="120px">
        <Heading level="4">
          {parseFloat(reserveRatio.toString()) / 100}
          <Unit>%</Unit>
        </Heading>
        <Type>Cash Drag</Type>
      </HeaderBox>
      <HeaderBox style={{ borderRight: 'none' }}>
        <Heading level="4">
          {toPrecision((Math.round((currentJuniorRatio || 0) * 10000) / 100).toString(), 2)}
          <Unit>%</Unit>
        </Heading>
        <Type>Current TIN Risk Buffer</Type>
      </HeaderBox>
      <HeaderBox style={{ borderRight: 'none' }}>
        <Heading level="4">
          {toPrecision((Math.round((minJuniorRatio || 0) * 10000) / 100).toString(), 2)}
          <Unit>%</Unit>
        </Heading>
        <Type>Minimum TIN Risk Buffer</Type>
      </HeaderBox>
    </Card>
  )
}

export default AOMetrics

const Card = styled(Box)`
  @media (max-width: 899px) {
    flex-direction: column;
  }
`

const HeaderBox = styled(Box)<{ width?: string }>`
  text-align: center;
  border-right: 1px solid #dadada;
  width: ${(props) => props.width || '200px'};
  flex-direction: column;
  justify-content: center;
  padding: 10px 20px 10px 0;
  height: 80px;

  h3,
  h4,
  h5,
  h6 {
    margin: 0 4px 4px 4px;
  }

  @media (max-width: 899px) {
    border-right: none;
    flex-direction: column-reverse;
    text-align: left;

    h3,
    h4,
    h5,
    h6 {
      margin: 4px 0 0 0;
    }
  }
`

const Type = styled.div`
  font-weight: 500;
  font-size: 12px;
  line-height: 20px;
  color: #979797;
`

const TokenLogo = styled.img`
  vertical-align: middle;
  margin: 0 8px 0 0;
  width: 20px;
  height: 20px;
  position: relative;
  top: -2px;
`

const Unit = styled.span`
  font-weight: 500;
  font-size: 14px;
  line-height: 28px;
  margin-left: 4px;
  color: #333;
`
