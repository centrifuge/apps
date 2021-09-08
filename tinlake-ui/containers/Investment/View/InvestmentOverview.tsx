import { baseToDisplay, feeToInterestRate, ITinlake } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Heading, Table, TableBody, TableCell, TableRow } from 'grommet'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { Card } from '../../../components/Card'
import { Box, Shelf, Stack } from '../../../components/Layout'
import { LoadingValue } from '../../../components/LoadingValue/index'
import { Tooltip } from '../../../components/Tooltip'
import { Pool, UpcomingPool } from '../../../config'
import { loadLoans, LoansState, SortableLoan } from '../../../ducks/loans'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
import { useTrancheYield } from '../../../utils/hooks'
import { toPrecision } from '../../../utils/toPrecision'
import { usePool } from '../../../utils/usePool'
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
  const { data: poolData } = usePool(props.tinlake.contractAddresses.ROOT_CONTRACT)
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

  const dropTotalValue = poolData?.senior ? poolData?.senior.totalSupply.mul(poolData.senior!.tokenPrice) : undefined
  const tinTotalValue = poolData ? poolData.junior.totalSupply.mul(poolData?.junior.tokenPrice) : undefined

  const minJuniorRatio = poolData ? parseRatio(poolData.minJuniorRatio) : undefined
  const currentJuniorRatio = poolData ? parseRatio(poolData.currentJuniorRatio) : undefined

  const { dropYield } = useTrancheYield(props.tinlake.contractAddresses.ROOT_CONTRACT)

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
        <Card p="medium" flex="1 1 35%">
          <Shelf mb="small">
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
          </Shelf>

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

          <Shelf mb="small">
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
          </Shelf>

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
        </Card>
        <BalanceSheetDiagram direction="row">
          <BalanceSheetDiagramLeft>
            <BalanceSheetMidLine>&nbsp;</BalanceSheetMidLine>
            <BalanceSheetFiller>&nbsp;</BalanceSheetFiller>
          </BalanceSheetDiagramLeft>
          <BalanceSheetDiagramRight>&nbsp;</BalanceSheetDiagramRight>
        </BalanceSheetDiagram>

        <Stack flex="1 1 35%" justifyContent="space-between">
          <Card p="medium" mb="small">
            <Shelf justifyContent="space-between">
              <Heading level="5" margin={{ bottom: 'xsmall', top: '0' }}>
                <Box as={TokenLogo} src={`/static/DROP_final.svg`} display={['none', 'inline']} />
                DROP Tranche
              </Heading>
              <Heading level="5" margin={{ left: 'auto', top: '0', bottom: 'xsmall' }}>
                <LoadingValue done={dropTotalValue !== undefined} height={22}>
                  {dropTotalValue && addThousandsSeparators(toPrecision(baseToDisplay(dropTotalValue, 27 + 18), 0))}{' '}
                  {props.selectedPool.metadata.currencySymbol || 'DAI'}
                </LoadingValue>
              </Heading>
            </Shelf>
            <Stack gap="small">
              <TrancheNote>Senior tranche &mdash; Lower risk, stable return</TrancheNote>
              <div>
                <Shelf justifyContent="space-between">
                  <TrancheText>Current token price</TrancheText>
                  <LoadingValue done={poolData?.senior !== undefined} height={18}>
                    <TrancheText>
                      {poolData?.senior &&
                        addThousandsSeparators(toPrecision(baseToDisplay(poolData?.senior!.tokenPrice || '0', 27), 4))}
                    </TrancheText>
                  </LoadingValue>
                </Shelf>

                <Shelf justifyContent="space-between">
                  {dropYield && !(poolData?.netAssetValue.isZero() && poolData?.reserve.isZero()) && (
                    <>
                      <TrancheText>Current DROP yield (30d APY)</TrancheText>
                      <TrancheText>{dropYield} %</TrancheText>
                    </>
                  )}
                  {(!dropYield || (poolData?.netAssetValue.isZero() && poolData?.reserve.isZero())) && (
                    <>
                      <TrancheText>Fixed DROP rate (APR)</TrancheText>
                      <TrancheText>
                        {toPrecision(feeToInterestRate(poolData?.senior?.interestRate || '0'), 2)}%
                      </TrancheText>
                    </>
                  )}
                </Shelf>
              </div>
            </Stack>
          </Card>

          <DividerTop>
            <DividerInner>&nbsp;</DividerInner>
          </DividerTop>

          <Box mt="xsmall" mb="medium" textAlign="center">
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

          <Card p="medium">
            <Shelf justifyContent="space-between">
              <Heading level="5" margin={{ bottom: 'xsmall', top: '0' }}>
                <Box as={TokenLogo} src={`/static/TIN_final.svg`} display={['none', 'inline']} />
                TIN Tranche
              </Heading>
              <Heading level="5" margin={{ left: 'auto', top: '0', bottom: 'xsmall' }}>
                <LoadingValue done={tinTotalValue !== undefined} height={22}>
                  {tinTotalValue && addThousandsSeparators(toPrecision(baseToDisplay(tinTotalValue, 27 + 18), 0))}{' '}
                  {props.selectedPool.metadata.currencySymbol || 'DAI'}
                </LoadingValue>
              </Heading>
            </Shelf>
            <Stack gap="small">
              <TrancheNote>Junior tranche &mdash; Higher risk, variable return</TrancheNote>
              <Shelf justifyContent="space-between">
                <TrancheText>Current token price</TrancheText>
                <LoadingValue done={poolData?.senior !== undefined} height={18}>
                  <TrancheText>
                    {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.junior.tokenPrice || '0', 27), 4))}
                  </TrancheText>
                </LoadingValue>
              </Shelf>
            </Stack>
          </Card>
        </Stack>
      </FlexWrapper>
    </>
  )
}

export default InvestmentOverview

const TrancheNote = styled.div`
  color: #777;
`

const TrancheText = styled.div`
  color: #777;
  font-weight: 500;
  line-height: 24px;
`
