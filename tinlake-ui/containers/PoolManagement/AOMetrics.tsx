import { baseToDisplay, feeToInterestRate } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box, Heading } from 'grommet'
import * as React from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import { Pool } from '../../config'
import { LoansState, SortableLoan } from '../../ducks/loans'
import { PoolData, PoolState } from '../../ducks/pool'
import { addThousandsSeparators } from '../../utils/addThousandsSeparators'
import { useTrancheYield } from '../../utils/hooks'
import { toPrecision } from '../../utils/toPrecision'

interface Props {
  activePool: Pool
}

const e18 = new BN(10).pow(new BN(18))

const AOMetrics: React.FC<Props> = (props: Props) => {
  const pool = useSelector<any, PoolState>((state) => state.pool)
  const poolData = pool?.data as PoolData | undefined

  const { dropYield, tinYield } = useTrancheYield()
  const dropRate = poolData?.senior?.interestRate || undefined

  const reserveRatio =
    poolData && !poolData.reserve.add(poolData.netAssetValue).isZero()
      ? poolData.reserve
          .mul(e18)
          .div(poolData.reserve.add(poolData.netAssetValue))
          .div(new BN('10').pow(new BN('14')))
      : new BN(0)

  const loans = useSelector<any, LoansState>((state) => state.loans)
  const ongoingAssets = loans?.loans
    ? loans?.loans.filter((loan) => loan.status && loan.status === 'ongoing')
    : undefined
  const outstandingDebt = ongoingAssets
    ? ongoingAssets
        .filter((loan) => loan.maturityDate && loan.financingDate)
        .reduce((current: BN, loan: SortableLoan) => {
          return current.add(loan.debt)
        }, new BN(0))
    : new BN(0)
  const repaymentsDue = ongoingAssets
    ? ongoingAssets
        .filter((loan) => loan.maturityDate && loan.financingDate)
        .reduce((current: BN, loan: SortableLoan) => {
          return loan.maturityDate && loan.maturityDate <= new Date().setDate(new Date().getDate() + 7) / 1000
            ? current.add(loan.debt)
            : current
        }, new BN(0))
    : new BN(0)

  return (
    <Card
      elevation="small"
      round="xsmall"
      background="white"
      direction="row"
      justify="center"
      pad="medium"
      style={{ zIndex: 3 }}
    >
      <HeaderBox>
        <Heading level="4">
          <TokenLogo src={`/static/currencies/${props.activePool.metadata.currencySymbol}.svg`} />
          {addThousandsSeparators(
            toPrecision(
              baseToDisplay((poolData?.netAssetValue || new BN(0)).add(poolData?.reserve || new BN(0)), 18),
              0
            )
          )}
          <Unit>{props.activePool.metadata.currencySymbol}</Unit>
        </Heading>
        <Type>Pool Value</Type>
      </HeaderBox>
      <HeaderBox style={tinYield ? { borderRight: 'none' } : undefined}>
        <Heading level="4">
          <TokenLogo src={`/static/DROP_final.svg`} />
          {dropYield && (poolData?.netAssetValue.gtn(0) || poolData?.reserve.gtn(0))
            ? dropYield
            : toPrecision(feeToInterestRate(dropRate || '0'), 2)}
          <Unit>%</Unit>
        </Heading>
        {dropYield && (poolData?.netAssetValue.gtn(0) || poolData?.reserve.gtn(0)) && (
          <Box>
            <Type>DROP APY (30 days)</Type>
          </Box>
        )}
        {!(dropYield && (poolData?.netAssetValue.gtn(0) || poolData?.reserve.gtn(0))) && (
          <Box>
            <Type>Fixed DROP rate (APR)</Type>
          </Box>
        )}
      </HeaderBox>
      {tinYield && (
        <HeaderBox pad={{ right: 'large' }}>
          <Heading level="4">
            <TokenLogo src={`/static/TIN_final.svg`} />
            {tinYield}
            <Unit>%</Unit>
          </Heading>
          <Box>
            <Type>TIN APY (3 months)</Type>
          </Box>
        </HeaderBox>
      )}
      <HeaderBox style={{ borderRight: 'none' }}>
        <Heading level="4">
          {addThousandsSeparators(toPrecision(baseToDisplay(outstandingDebt, 18), 0))}
          <Unit>{props.activePool.metadata.currencySymbol}</Unit>
        </Heading>
        <Type>Outstanding Debt</Type>
      </HeaderBox>
      <HeaderBox style={{ borderRight: 'none' }}>
        <Heading level="4">
          {addThousandsSeparators(toPrecision(baseToDisplay(repaymentsDue, 18), 0))}
          <Unit>{props.activePool.metadata.currencySymbol}</Unit>
        </Heading>
        <Type>Repayments Due (7 days)</Type>
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
  width: ${(props) => props.width || '260px'};
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

const Unit = styled.span`
  font-weight: 500;
  font-size: 14px;
  line-height: 28px;
  margin-left: 4px;
  color: #333;
`

const TokenLogo = styled.img`
  vertical-align: middle;
  margin: 0 8px 0 0;
  width: 20px;
  height: 20px;
  position: relative;
  top: -2px;
`
