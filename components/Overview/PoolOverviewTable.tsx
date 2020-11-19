import * as React from 'react'
import { Box, Heading, Table, TableBody, TableRow, TableCell } from 'grommet'
import { useSelector } from 'react-redux'
import { baseToDisplay, feeToInterestRate } from '@centrifuge/tinlake-js'
import { Tooltip } from '@centrifuge/axis-tooltip'

import { Pool, UpcomingPool } from '../../config'
import { toPrecision } from '../../utils/toPrecision'
import { addThousandsSeparators } from '../../utils/addThousandsSeparators'
import { LoansState } from '../../ducks/loans'
import { PoolState, PoolData } from '../../ducks/pool'
import { LoadingValue } from '../LoadingValue/index'
import { Sidenote, TokenLogo } from './styles'
import InvestAction from '../../components/InvestAction'

interface Props {
  selectedPool: Pool | UpcomingPool
}

const PoolOverviewTable: React.FC<Props> = (props: Props) => {
  const pool = useSelector<any, PoolState>((state) => state.pool)
  const poolData = pool?.data as PoolData | undefined

  const loans = useSelector<any, LoansState>((state) => state.loans)
  const outstandingLoans = loans?.loans
    ? loans?.loans.filter((loan) => loan.status && loan.status === 'ongoing').length
    : undefined

  const poolValue =
    (poolData?.netAssetValue && poolData?.reserve && poolData?.netAssetValue.add(poolData.reserve)) || undefined
  const minJuniorRatio = poolData?.minJuniorRatio || undefined
  const currentJuniorRatio = poolData?.currentJuniorRatio || undefined
  const dropRate = (poolData && poolData.senior && poolData.senior.interestRate) || undefined
  const seniorTokenSupply = (poolData && poolData.senior && poolData.senior.totalSupply) || undefined
  const juniorTokenSupply = (poolData && poolData.junior.totalSupply) || undefined

  const isUpcoming = 'isUpcoming' in props.selectedPool && props.selectedPool.isUpcoming === true

  return (
    <Box basis={'1/3'}>
      <Box>
        <Box direction="row" margin={{ top: 'small', bottom: 'small' }}>
          <Heading level="5" margin={'0'}>
            Pool Value
          </Heading>
          <Heading level="5" margin={{ left: 'auto', top: '0', bottom: '0' }}>
            <LoadingValue done={poolValue !== undefined || isUpcoming} height={24}>
              {addThousandsSeparators(toPrecision(baseToDisplay(poolValue || '0', 18), 0))} DAI
            </LoadingValue>
          </Heading>
        </Box>

        <Table>
          <TableBody>
            <TableRow>
              <TableCell scope="row">Active Financings</TableCell>
              <TableCell style={{ textAlign: 'end' }}>
                <LoadingValue done={outstandingLoans !== undefined}>{outstandingLoans}</LoadingValue>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell scope="row">
                <Tooltip
                  title="Net Asset Value"
                  description="The NAV reflects the present value of the outstanding portfolio of financings. It is basically the sum of present values of the risk-adjusted expected repayments of all outstanding financings."
                  link={{
                    text: 'Learn more',
                    url:
                      'https://medium.com/centrifuge/tinlake-pricing-and-valuation-series-part-2-valuing-an-asset-portfolio-247d8f2f0d5',
                  }}
                >
                  <span>Asset Value</span>
                </Tooltip>
              </TableCell>
              <TableCell style={{ textAlign: 'end' }}>
                <LoadingValue done={poolData?.netAssetValue !== undefined || isUpcoming}>
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
                <span>Pool Reserve</span>
              </TableCell>
              <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
                <LoadingValue done={poolData?.reserve !== undefined || isUpcoming} height={39}>
                  <>
                    {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.reserve || '0', 18), 0))} DAI
                    <Sidenote>
                      Max: {addThousandsSeparators(toPrecision(baseToDisplay(poolData?.maxReserve || '0', 18), 0))} DAI
                    </Sidenote>
                  </>
                </LoadingValue>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Heading level="5" margin={{ top: 'large', bottom: 'small' }}>
          Investments
        </Heading>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell scope="row">DROP APR</TableCell>
              <TableCell style={{ textAlign: 'end' }}>
                <LoadingValue done={dropRate !== undefined || isUpcoming}>
                  {toPrecision(feeToInterestRate(dropRate || '0'), 2)} %
                </LoadingValue>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell scope="row">
                <span>
                  <TokenLogo src={`/static/DROP_final.svg`} />
                  DROP Supply
                </span>
              </TableCell>
              <TableCell style={{ textAlign: 'end' }}>
                <LoadingValue done={seniorTokenSupply !== undefined || isUpcoming}>
                  {addThousandsSeparators(toPrecision(baseToDisplay(seniorTokenSupply || '0', 18), 0))} DROP
                </LoadingValue>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell scope="row">
                <span>
                  <TokenLogo src={`/static/TIN_final.svg`} />
                  TIN Supply
                </span>
              </TableCell>
              <TableCell style={{ textAlign: 'end' }}>
                <LoadingValue done={juniorTokenSupply !== undefined || isUpcoming}>
                  {addThousandsSeparators(toPrecision(baseToDisplay(juniorTokenSupply || '0', 18), 0))} TIN
                </LoadingValue>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell
                scope="row"
                style={{ alignItems: 'start', justifyContent: 'center' }}
                pad={{ vertical: '6px' }}
              >
                TIN Risk Buffer
              </TableCell>
              <TableCell style={{ textAlign: 'end' }} pad={{ vertical: '6px' }}>
                <LoadingValue done={currentJuniorRatio !== undefined || isUpcoming} height={39}>
                  {addThousandsSeparators(toPrecision(baseToDisplay(currentJuniorRatio || '0', 25), 2))} %
                  <Sidenote>
                    Min: {addThousandsSeparators(toPrecision(baseToDisplay(minJuniorRatio || '0', 25), 2))} %
                  </Sidenote>
                </LoadingValue>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Box margin={{ vertical: 'medium' }}>
          <InvestAction pool={props.selectedPool} />
        </Box>
      </Box>
    </Box>
  )
}

export default PoolOverviewTable
