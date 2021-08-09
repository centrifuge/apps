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
import { useTrancheYield } from '../../../utils/hooks'
import { toPrecision } from '../../../utils/toPrecision'
import {
  BalanceSheetDiagram,
  BalanceSheetDiagramLeft,
  BalanceSheetDiagramRight,
  BalanceSheetFiller,
  BalanceSheetMidLine,
  DividerBottom,
  DividerInner,
  DividerTop,
  FlexWrapper,
  TokenLogo,
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

  const ongoingAssets = loans?.loans
    ? loans?.loans.filter((loan) => loan.status && loan.status === 'ongoing')
    : undefined
  const avgAmount = ongoingAssets
    ? ongoingAssets
        .filter((loan) => loan.debt)
        .reduce((sum: BN, loan: SortableLoan) => {
          return sum.add(new BN(loan.debt!))
        }, new BN(0))
        .divn(ongoingAssets.length)
    : undefined
  const avgInterestRate = ongoingAssets
    ? ongoingAssets
        .filter((loan) => loan.interestRate)
        .reduce((sum: BN, loan: SortableLoan) => {
          return sum.add(new BN(loan.interestRate!))
        }, new BN(0))
        .divn(ongoingAssets.length)
    : undefined
  const avgMaturity = ongoingAssets
    ? ongoingAssets
        .filter((loan) => loan.maturityDate && loan.financingDate)
        .reduce((sum: number, loan: SortableLoan) => {
          return sum + (loan.maturityDate! - loan.financingDate!) / SecondsInDay
        }, 0) / ongoingAssets.length
    : undefined

  const dispatch = useDispatch()
  const poolData = pool?.data as PoolData | undefined

  const dropTotalValue = poolData?.senior ? poolData?.senior.totalSupply.mul(poolData.senior!.tokenPrice) : undefined
  const tinTotalValue = poolData ? poolData.junior.totalSupply.mul(poolData?.junior.tokenPrice) : undefined

  const minJuniorRatio = poolData ? parseRatio(poolData.minJuniorRatio) : undefined
  const currentJuniorRatio = poolData ? parseRatio(poolData.currentJuniorRatio) : undefined

  const { dropYield } = useTrancheYield()

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
      <FlexWrapper>
        <Box
          direction="column"
          justify="start"
          pad="medium"
          elevation="small"
          round="xsmall"
          margin={{ bottom: 'medium' }}
          background="white"
          style={{ flex: '1 1 35%' }}
        >
          <Box>
            <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
              <Heading level="5" margin={'0'}>
                <Tooltip id="assetValue" underline>
                  Asset Value
                </Tooltip>
              </Heading>
              <Heading level="5" margin={{ left: 'auto', top: '0', bottom: '0' }}>
                <LoadingValue done={poolData?.netAssetValue !== undefined}>
                  {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.netAssetValue || '0', 18), 0))}{' '}
                  {props.selectedPool.metadata.currencySymbol || 'DAI'}
                </LoadingValue>
              </Heading>
            </Box>

            <Table margin={{ bottom: 'large' }}>
              <TableBody>
                <TableRow>
                  <TableCell scope="row">Number of Assets</TableCell>
                  <TableCell style={{ textAlign: 'end' }}>
                    <LoadingValue done={ongoingAssets !== undefined}>{ongoingAssets?.length || 0}</LoadingValue>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row">Average Outstanding Amount</TableCell>
                  <TableCell style={{ textAlign: 'end' }}>
                    <LoadingValue done={avgAmount !== undefined}>
                      {addThousandsSeparators(toPrecision(baseToDisplay(avgAmount || new BN(0), 18), 0))}{' '}
                      {props.selectedPool.metadata.currencySymbol || 'DAI'}
                    </LoadingValue>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell scope="row">
                    <Tooltip id="financingFee" underline>
                      Average Financing Fee
                    </Tooltip>
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
                <Tooltip id="reserve" underline>
                  Reserve
                </Tooltip>
              </Heading>
              <Heading level="5" margin={{ left: 'auto', top: '0', bottom: '0' }}>
                <LoadingValue done={poolData?.reserve !== undefined}>
                  {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.reserve || '0', 18), 0))}{' '}
                  {props.selectedPool.metadata.currencySymbol || 'DAI'}
                </LoadingValue>
              </Heading>
            </Box>

            <Table>
              <TableBody>
                <TableRow>
                  <TableCell scope="row" border={{ color: 'transparent' }}>
                    <Tooltip id="reserveRatio" underline>
                      Reserve Ratio
                    </Tooltip>
                  </TableCell>
                  <TableCell style={{ textAlign: 'end' }} border={{ color: 'transparent' }}>
                    <LoadingValue done={reserveRatio !== undefined}>
                      {parseFloat(reserveRatio.toString()) / 100}%
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

        <Box direction="column" justify="between" style={{ flex: '1 1 35%' }}>
          <Box pad="medium" elevation="small" round="xsmall" margin={{ bottom: 'small' }} background="white">
            <Box direction="row" margin={{ top: '0', bottom: '0' }}>
              <Box direction="column">
                <Heading level="5" margin={{ bottom: 'xsmall', top: '0' }}>
                  <TokenLogo src={`/static/DROP_final.svg`} />
                  DROP Tranche Value
                </Heading>
                <TrancheNote>Senior tranche</TrancheNote>
                <TrancheNote>Lower risk, stable return</TrancheNote>
              </Box>
              <Box margin={{ left: 'auto' }}>
                <Heading level="5" margin={{ left: 'auto', top: '0', bottom: 'xsmall' }}>
                  <LoadingValue done={dropTotalValue !== undefined} height={22}>
                    {dropTotalValue && addThousandsSeparators(toPrecision(baseToDisplay(dropTotalValue, 27 + 18), 0))}{' '}
                    {props.selectedPool.metadata.currencySymbol || 'DAI'}
                  </LoadingValue>
                </Heading>
                <span style={{ textAlign: 'right' }}>
                  <LoadingValue done={poolData?.senior !== undefined} height={21}>
                    Current token price:{' '}
                    {poolData?.senior &&
                      addThousandsSeparators(toPrecision(baseToDisplay(poolData?.senior!.tokenPrice || '0', 27), 4))}
                  </LoadingValue>
                </span>
                <Box margin={{ left: 'auto' }} style={{ textAlign: 'right' }} direction="row">
                  {dropYield && !(pool?.data?.netAssetValue.isZero() && pool?.data?.reserve.isZero()) && (
                    <>Current DROP yield (30d APY): {dropYield} %</>
                  )}
                  {(!dropYield || (pool?.data?.netAssetValue.isZero() && pool?.data?.reserve.isZero())) && (
                    <>
                      Fixed DROP rate (APR): {toPrecision(feeToInterestRate(poolData?.senior?.interestRate || '0'), 2)}%
                    </>
                  )}
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
                {toPrecision((Math.round((currentJuniorRatio || 0) * 10000) / 100).toString(), 2)}%{' '}
                <Tooltip id="tinRiskBuffer" underline>
                  TIN buffer
                </Tooltip>
              </span>{' '}
              (min: {toPrecision((Math.round((minJuniorRatio || 0) * 10000) / 100).toString(), 2)}%)
            </div>
          </Box>

          <DividerBottom>
            <DividerInner>&nbsp;</DividerInner>
          </DividerBottom>

          <Box pad="medium" elevation="small" round="xsmall" margin={{ bottom: 'medium' }} background="white">
            <Box direction="row" margin={{ top: '0', bottom: '0' }}>
              <Box direction="column">
                <Heading level="5" margin={{ bottom: 'xsmall', top: '0' }}>
                  <TokenLogo src={`/static/TIN_final.svg`} />
                  TIN Tranche Value
                </Heading>
                <TrancheNote>Junior tranche</TrancheNote>
                <TrancheNote>Higher risk, variable return</TrancheNote>
              </Box>
              <Box margin={{ left: 'auto' }}>
                <Heading level="5" margin={{ left: 'auto', top: '0', bottom: 'xsmall' }}>
                  <LoadingValue done={tinTotalValue !== undefined} height={22}>
                    {tinTotalValue && addThousandsSeparators(toPrecision(baseToDisplay(tinTotalValue, 27 + 18), 0))}{' '}
                    {props.selectedPool.metadata.currencySymbol || 'DAI'}
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
      </FlexWrapper>
    </>
  )
}

export default InvestmentOverview

const TrancheNote = styled.div`
  color: #777;
`
