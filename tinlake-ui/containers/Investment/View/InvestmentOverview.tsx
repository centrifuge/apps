import { baseToDisplay, feeToInterestRate, ITinlake } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { Box, Heading, Table, TableBody, TableCell, TableRow } from 'grommet'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import InvestAction from '../../../components/InvestAction'
import { LoadingValue } from '../../../components/LoadingValue/index'
import OnboardModal from '../../../components/OnboardModal'
import { TINRatioBar } from '../../../components/TINRatioBar/index'
import { Tooltip } from '../../../components/Tooltip'
import config, { Pool, UpcomingPool } from '../../../config'
import { loadLoans, LoansState } from '../../../ducks/loans'
import { PoolData, PoolState } from '../../../ducks/pool'
import { addThousandsSeparators } from '../../../utils/addThousandsSeparators'
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
  Sidenote,
  TokenLogo,
} from './styles'

interface Props {
  selectedPool: Pool | UpcomingPool
  tinlake: ITinlake
}

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
  const dispatch = useDispatch()
  const poolData = pool?.data as PoolData | undefined

  const poolValue =
    (poolData?.netAssetValue && poolData?.reserve && poolData?.netAssetValue.add(poolData.reserve)) || undefined
  const dropRate = poolData?.senior?.interestRate || undefined

  const dropTotalValue = poolData?.senior ? poolData?.senior.totalSupply.mul(poolData.senior!.tokenPrice) : undefined
  const tinTotalValue = poolData ? poolData.junior.totalSupply.mul(poolData?.junior.tokenPrice) : undefined

  const currentJuniorRatio = poolData ? parseRatio(poolData.currentJuniorRatio) : undefined
  const minJuniorRatio = poolData ? parseRatio(poolData.minJuniorRatio) : undefined
  const maxJuniorRatio = poolData ? parseRatio(poolData.maxJuniorRatio) : undefined

  React.useEffect(() => {
    // sign()
    dispatch(loadLoans(props.tinlake))
  }, [props.selectedPool])

  return (
    <Box direction="row" justify="between">
      <Box width="420px" pad="medium" elevation="small" round="xsmall" margin={{ bottom: 'medium' }} background="white">
        <Box direction="row" margin={{ top: '0', bottom: 'small' }}>
          <Heading level="5" margin={'0'}>
            <Tooltip id="poolValue">Pool Value</Tooltip>
          </Heading>
          <Heading level="5" margin={{ left: 'auto', top: '0', bottom: '0' }}>
            <LoadingValue done={poolValue !== undefined} height={22}>
              {addThousandsSeparators(toPrecision(baseToDisplay(poolValue || '0', 18), 0))} DAI
            </LoadingValue>
          </Heading>
        </Box>

        <Table>
          <TableBody>
            <TableRow>
              <TableCell scope="row">
                <Tooltip id="assetValue">Asset Value</Tooltip>
              </TableCell>
              <TableCell style={{ textAlign: 'end' }}>
                <LoadingValue done={poolData?.netAssetValue !== undefined}>
                  {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.netAssetValue || '0', 18), 0))} DAI
                </LoadingValue>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell
                scope="row"
                style={{ alignItems: 'start', justifyContent: 'center' }}
                pad={{ vertical: '6px' }}
              >
                <Tooltip id="poolReserve">Pool Reserve</Tooltip>
              </TableCell>
              <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
                <LoadingValue done={poolData?.reserve !== undefined} height={39}>
                  <>
                    {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.reserve || '0', 18), 0))} DAI
                    <Sidenote>
                      Max: {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.maxReserve || '0', 18), 0))} DAI
                    </Sidenote>
                  </>
                </LoadingValue>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell scope="row" border={{ color: 'transparent' }}>
                <span>
                  <TokenLogo src={`/static/DROP_final.svg`} />
                  <Tooltip id="dropAPR">DROP APR</Tooltip>
                </span>
              </TableCell>
              <TableCell style={{ textAlign: 'end' }} border={{ color: 'transparent' }}>
                <LoadingValue done={dropRate !== undefined}>
                  {toPrecision(feeToInterestRate(dropRate || '0'), 2)} %
                </LoadingValue>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Heading level="5" margin={{ bottom: 'small' }}>
          Assets
        </Heading>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell scope="row">Active Financings</TableCell>
              <TableCell style={{ textAlign: 'end' }}>
                <LoadingValue done={outstandingLoans !== undefined}>{outstandingLoans || 0}</LoadingValue>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell scope="row" border={{ color: 'transparent' }}>
                <Tooltip id="outstandingVolume">Outstanding Volume</Tooltip>
              </TableCell>
              <TableCell style={{ textAlign: 'end' }} border={{ color: 'transparent' }}>
                <LoadingValue done={poolData?.outstandingVolume !== undefined}>
                  {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.outstandingVolume || '0', 18), 0))} DAI
                </LoadingValue>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Box margin={{ top: 'medium' }}>
          {config.featureFlagNewOnboarding ? (
            <OnboardModal pool={props.selectedPool} />
          ) : (
            <InvestAction pool={props.selectedPool} />
          )}
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
          width="420px"
          pad="medium"
          elevation="small"
          round="xsmall"
          margin={{ bottom: 'small' }}
          background="white"
        >
          <Box direction="row" margin={{ top: '0', bottom: '0' }}>
            <Heading level="5" margin={'0'}>
              <TokenLogo src={`/static/DROP_final.svg`} />
              <Tooltip id="dropValue">DROP Value</Tooltip>
            </Heading>
            <Box margin={{ left: 'auto' }}>
              <Heading level="5" margin={{ left: 'auto', top: '0', bottom: '0' }}>
                <LoadingValue done={dropTotalValue !== undefined} height={22}>
                  {dropTotalValue && addThousandsSeparators(toPrecision(baseToDisplay(dropTotalValue, 27 + 18), 0))} DAI
                </LoadingValue>
              </Heading>
              <span>
                <LoadingValue done={poolData?.senior !== undefined} height={21}>
                  {poolData?.senior &&
                    addThousandsSeparators(
                      toPrecision(baseToDisplay(poolData?.senior!.totalSupply || '0', 18), 0)
                    )}{' '}
                  Token supply @{' '}
                  {poolData?.senior &&
                    addThousandsSeparators(toPrecision(baseToDisplay(poolData?.senior!.tokenPrice || '0', 27), 4))}{' '}
                  DAI
                </LoadingValue>
              </span>
            </Box>
          </Box>
        </Box>

        <DividerTop>
          <DividerInner>&nbsp;</DividerInner>
        </DividerTop>

        <Box margin={{ top: 'small', bottom: 'large' }}>
          <Heading level="5" margin={{ top: 'none', bottom: '28px', left: 'auto', right: 'auto' }}>
            <Tooltip id="tinRiskBuffer">TIN Risk Buffer</Tooltip>
          </Heading>
          <Box margin={{ left: '20px' }}>
            <TINRatioBar current={currentJuniorRatio} min={minJuniorRatio} max={maxJuniorRatio} />
          </Box>
        </Box>

        <DividerBottom>
          <DividerInner>&nbsp;</DividerInner>
        </DividerBottom>

        <Box
          width="420px"
          pad="medium"
          elevation="small"
          round="xsmall"
          margin={{ bottom: 'medium' }}
          background="white"
        >
          <Box direction="row" margin={{ top: '0', bottom: '0' }}>
            <Heading level="5" margin={'0'}>
              <TokenLogo src={`/static/TIN_final.svg`} />
              <Tooltip id="tinValue">TIN Value</Tooltip>
            </Heading>
            <Box margin={{ left: 'auto' }}>
              <Heading level="5" margin={{ left: 'auto', top: '0', bottom: '0' }}>
                <LoadingValue done={tinTotalValue !== undefined} height={22}>
                  {tinTotalValue && addThousandsSeparators(toPrecision(baseToDisplay(tinTotalValue, 27 + 18), 0))} DAI
                </LoadingValue>
              </Heading>
              <span>
                <LoadingValue done={poolData?.junior !== undefined} height={21}>
                  {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.junior.totalSupply || '0', 18), 0))} Token
                  supply @{' '}
                  {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.junior.tokenPrice || '0', 27), 4))} DAI
                </LoadingValue>
              </span>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default InvestmentOverview
