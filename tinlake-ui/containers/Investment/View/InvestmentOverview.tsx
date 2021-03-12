import { baseToDisplay, feeToInterestRate, ITinlake } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box, Heading, Table, TableBody, TableCell, TableRow } from 'grommet'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { LoadingValue } from '../../../components/LoadingValue/index'
import { Tooltip } from '../../../components/Tooltip'
import { Pool, UpcomingPool } from '../../../config'
import { loadLoans, LoansState, SortableLoan } from '../../../ducks/loans'
import { PoolData, PoolState } from '../../../ducks/pool'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { toPrecision } from '../../../utils/toPrecision'
import {
  DividerBottom,
  DividerInner,
  DividerTop,
  TokenLogo,
  BalanceSheetDiagram,
  BalanceSheetDiagramLeft,
  BalanceSheetDiagramRight,
  BalanceSheetFiller,
  BalanceSheetMidLine,
} from './styles'

interface Props {
  selectedPool: Pool | UpcomingPool
  tinlake: ITinlake
}

const SecondsInDay = 60 * 60 * 24

const e18 = new BN(10).pow(new BN(18))

const parseRatio = (num: BN): number => {
  const base = new BN(10).pow(new BN(20))
  return num.div(base).toNumber() / 10 ** 7
}

const InvestmentOverview: React.FC<Props> = (props: Props) => {
  const pool = useSelector<any, PoolState>((state) => state.pool)
  const loans = useSelector<any, LoansState>((state) => state.loans)
  const outstandingLoans = loans?.loans
    ? loans?.loans.filter((loan) => loan.status && loan.status === 'ongoing').length
    : undefined

  const financedAssets = loans?.loans
    ? loans?.loans.filter(
        (loan) =>
          (loan.status && loan.status === 'ongoing') ||
          (loan.status === 'closed' && loan.borrowsAggregatedAmount && loan.maturityDate && loan.financingDate)
      )
    : undefined
  const avgAmount = financedAssets
    ? financedAssets
        .filter((loan) => loan.borrowsAggregatedAmount)
        .reduce((sum: BN, loan: SortableLoan) => {
          return sum.add(new BN(loan.borrowsAggregatedAmount!))
        }, new BN(0))
        .divn(financedAssets.length)
    : undefined
  const avgInterestRate = financedAssets
    ? financedAssets
        .filter((loan) => loan.interestRate)
        .reduce((sum: BN, loan: SortableLoan) => {
          return sum.add(new BN(loan.interestRate!))
        }, new BN(0))
        .divn(financedAssets.length)
    : undefined
  const avgMaturity = financedAssets
    ? financedAssets
        .filter((loan) => loan.maturityDate && loan.financingDate)
        .reduce((sum: number, loan: SortableLoan) => {
          return sum + (loan.maturityDate! - loan.financingDate!) / SecondsInDay
        }, 0) / financedAssets.length
    : undefined

  const dispatch = useDispatch()
  const poolData = pool?.data as PoolData | undefined

  const dropRate = poolData?.senior?.interestRate || undefined

  const dropTotalValue = poolData?.senior ? poolData?.senior.totalSupply.mul(poolData.senior!.tokenPrice) : undefined
  const tinTotalValue = poolData ? poolData.junior.totalSupply.mul(poolData?.junior.tokenPrice) : undefined

  const minJuniorRatio = poolData ? parseRatio(poolData.minJuniorRatio) : undefined
  const currentJuniorRatio = poolData ? parseRatio(poolData.currentJuniorRatio) : undefined

  const reserveRatio =
    poolData && !poolData.reserve.add(poolData.netAssetValue).isZero()
      ? poolData.reserve
          .mul(e18)
          .div(poolData.reserve.add(poolData.netAssetValue))
          .div(new BN('10').pow(new BN('14')))
      : new BN(0)

  React.useEffect(() => {
    dispatch(loadLoans(props.tinlake))
  }, [props.selectedPool])

  return (
    <>
      <Box direction="row" justify="between">
        <Box
          direction="column"
          justify="start"
          width="460px"
          pad="medium"
          elevation="small"
          round="xsmall"
          margin={{ bottom: 'medium' }}
          background="white"
        >
          <Box>
            <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
              <Heading level="5" margin={'0'}>
                <Tooltip id="poolValue">Asset Value</Tooltip>
              </Heading>
              <Heading level="5" margin={{ left: 'auto', top: '0', bottom: '0' }}>
                <LoadingValue done={poolData?.netAssetValue !== undefined}>
                  {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.netAssetValue || '0', 18), 0))} DAI
                </LoadingValue>
              </Heading>
            </Box>

            <Table margin={{ bottom: 'large' }}>
              <TableBody>
                <TableRow>
                  <TableCell scope="row">Number of Assets</TableCell>
                  <TableCell style={{ textAlign: 'end' }}>
                    <LoadingValue done={outstandingLoans !== undefined}>{outstandingLoans || 0}</LoadingValue>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row">Average Financing Amount</TableCell>
                  <TableCell style={{ textAlign: 'end' }}>
                    <LoadingValue done={avgAmount !== undefined}>
                      {addThousandsSeparators(toPrecision(baseToDisplay(avgAmount || new BN(0), 18), 0))} DAI
                    </LoadingValue>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row">
                    <Tooltip id="financingFee">Average Financing Fee</Tooltip>
                  </TableCell>
                  <TableCell style={{ textAlign: 'end' }}>
                    <LoadingValue done={avgInterestRate !== undefined}>
                      {toPrecision(feeToInterestRate(avgInterestRate || new BN(0)), 2)}%
                    </LoadingValue>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row" border={{ color: 'transparent' }}>
                    Average Maturity
                  </TableCell>
                  <TableCell style={{ textAlign: 'end' }} border={{ color: 'transparent' }}>
                    <LoadingValue done={avgMaturity !== undefined}>
                      {avgMaturity! > 90
                        ? `${Math.round(((avgMaturity || 0) / (365 / 12)) * 10) / 10} months`
                        : `${Math.round((avgMaturity || 0) * 10) / 10} days`}
                    </LoadingValue>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
              <Heading level="5" margin={'0'}>
                <Tooltip id="poolValue">Reserve</Tooltip>
              </Heading>
              <Heading level="5" margin={{ left: 'auto', top: '0', bottom: '0' }}>
                <LoadingValue done={poolData?.reserve !== undefined}>
                  {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.reserve || '0', 18), 0))} DAI
                </LoadingValue>
              </Heading>
            </Box>

            <Table>
              <TableBody>
                <TableRow>
                  <TableCell scope="row" border={{ color: 'transparent' }}>
                    <Tooltip id="reserveRatio">Reserve Ratio</Tooltip>
                  </TableCell>
                  <TableCell style={{ textAlign: 'end' }} border={{ color: 'transparent' }}>
                    <LoadingValue done={reserveRatio !== undefined}>
                      {parseFloat(reserveRatio.toString()) / 100} %
                    </LoadingValue>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </Box>
        <BalanceSheetDiagram direction="row">
          <BalanceSheetDiagramLeft>
            <BalanceSheetMidLine>&nbsp;</BalanceSheetMidLine>
            <BalanceSheetFiller>&nbsp;</BalanceSheetFiller>
          </BalanceSheetDiagramLeft>
          <BalanceSheetDiagramRight>&nbsp;</BalanceSheetDiagramRight>
        </BalanceSheetDiagram>

        <Box direction="column" justify="between">
          <Box
            width="460px"
            pad="medium"
            elevation="small"
            round="xsmall"
            margin={{ bottom: 'small' }}
            background="white"
          >
            <Box direction="row" margin={{ top: '0', bottom: '0' }}>
              <Box direction="column">
                <Heading level="5" margin={{ bottom: 'xsmall', top: '0' }}>
                  <TokenLogo src={`/static/DROP_final.svg`} />
                  <Tooltip id="dropValue">DROP Tranche Value</Tooltip>
                </Heading>
                <TrancheNote>Senior tranche</TrancheNote>
                <TrancheNote>Lower risk, stable return</TrancheNote>
              </Box>
              <Box margin={{ left: 'auto' }}>
                <Heading level="5" margin={{ left: 'auto', top: '0', bottom: 'xsmall' }}>
                  <LoadingValue done={dropTotalValue !== undefined} height={22}>
                    {dropTotalValue && addThousandsSeparators(toPrecision(baseToDisplay(dropTotalValue, 27 + 18), 0))}{' '}
                    DAI
                  </LoadingValue>
                </Heading>
                <span>
                  <LoadingValue done={poolData?.senior !== undefined} height={21}>
                    Current token price:{' '}
                    {poolData?.senior &&
                      addThousandsSeparators(toPrecision(baseToDisplay(poolData?.senior!.tokenPrice || '0', 27), 4))}
                  </LoadingValue>
                </span>
                <Box margin={{ left: 'auto' }} direction="row">
                  {toPrecision(feeToInterestRate(dropRate || '0'), 2)}% APR
                </Box>
              </Box>
            </Box>
          </Box>

          <DividerTop>
            <DividerInner>&nbsp;</DividerInner>
          </DividerTop>

          <Box margin={{ top: 'small', bottom: 'medium' }} style={{ textAlign: 'center' }}>
            <div>
              DROP is currently protected by a<br />
              <span style={{ fontWeight: 'bold' }}>
                {Math.round((currentJuniorRatio || 0) * 10000) / 100}% TIN buffer
              </span>{' '}
              (min: {Math.round((minJuniorRatio || 0) * 10000) / 100}%)
            </div>
          </Box>

          <DividerBottom>
            <DividerInner>&nbsp;</DividerInner>
          </DividerBottom>

          <Box
            width="460px"
            pad="medium"
            elevation="small"
            round="xsmall"
            margin={{ bottom: 'medium' }}
            background="white"
          >
            <Box direction="row" margin={{ top: '0', bottom: '0' }}>
              <Box direction="column">
                <Heading level="5" margin={{ bottom: 'xsmall', top: '0' }}>
                  <TokenLogo src={`/static/TIN_final.svg`} />
                  <Tooltip id="tinValue">TIN Tranche Value</Tooltip>
                </Heading>
                <TrancheNote>Junior tranche</TrancheNote>
                <TrancheNote>Higher risk, variable return</TrancheNote>
              </Box>
              <Box margin={{ left: 'auto' }}>
                <Heading level="5" margin={{ left: 'auto', top: '0', bottom: 'xsmall' }}>
                  <LoadingValue done={tinTotalValue !== undefined} height={22}>
                    {tinTotalValue && addThousandsSeparators(toPrecision(baseToDisplay(tinTotalValue, 27 + 18), 0))} DAI
                  </LoadingValue>
                </Heading>
                <span>
                  <LoadingValue done={poolData?.junior !== undefined} height={21}>
                    Current token price:{' '}
                    {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.junior.tokenPrice || '0', 27), 4))}
                  </LoadingValue>
                </span>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  )
}

export default InvestmentOverview

const TrancheNote = styled.div`
  color: #777;
`
