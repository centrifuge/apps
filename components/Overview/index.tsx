import * as React from 'react'
import BN from 'bn.js'
import { Box, Heading, Table, TableCell, TableRow, TableBody, Button, Anchor } from 'grommet'
import SecondaryHeader from '../../components/SecondaryHeader'
import { PoolState } from '../../ducks/pool'
import { LoansState } from '../../ducks/loans'
import { Spinner } from '@centrifuge/axis-spinner'
import LoanListData from '../../components/Loan/List'
import { Pool, UpcomingPool } from '../../config'
import { PoolLink } from '../../components/PoolLink'
import { toPrecision } from '../../utils/toPrecision'
import { addThousandsSeparators } from '../../utils/addThousandsSeparators'
import InvestAction from '../../components/InvestAction'
import { baseToDisplay, feeToInterestRate } from '@centrifuge/tinlake-js'
import { LoadingValue } from '../../components/LoadingValue/index'

interface Props {
  userAddress: string
  loans?: LoansState
  pool?: PoolState
  selectedPool: Pool | UpcomingPool
}

class Overview extends React.Component<Props> {
  render() {
    const { userAddress, loans, selectedPool, pool } = this.props

    const allLoans = (loans && loans.loans) || undefined
    const poolData = pool && pool.data

    const outstandingLoans = allLoans
      ? allLoans.filter((loan) => loan.status && loan.status === 'ongoing').length
      : undefined
    const outstandingDebt = allLoans
      ? allLoans.map((loan) => loan.debt).reduce((sum, debt) => sum.add(debt), new BN('0'))
      : undefined
    const availableFunds = poolData?.availableFunds || undefined
    const minJuniorRatio = poolData?.minJuniorRatio || undefined
    const currentJuniorRatio = poolData?.currentJuniorRatio || undefined
    const dropRate = (poolData && poolData.senior && poolData.senior.interestRate) || undefined
    const seniorTokenSupply = (poolData && poolData.senior && poolData.senior.totalSupply) || undefined
    const juniorTokenSupply = (poolData && poolData.junior.totalSupply) || undefined

    // show just recent 10 assets
    const startIndex = allLoans ? (allLoans.length >= 10 ? allLoans.length - 10 : 0) : undefined
    const latestLoans = allLoans ? allLoans.slice(startIndex, allLoans.length) : []

    return (
      <Box margin={{ bottom: 'large' }}>
        <SecondaryHeader>
          <Heading level="3">Pool Overview: {selectedPool.name} </Heading>
        </SecondaryHeader>

        <Box direction="row" margin={{ bottom: 'large' }}>
          <Box basis={'1/3'}>
            <Box>
              <Heading level="4" margin={{ top: 'small', bottom: 'small' }}>
                Assets
              </Heading>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell scope="row">Active Financings</TableCell>
                    <TableCell style={{ textAlign: 'end' }}>
                      <LoadingValue done={outstandingLoans !== undefined}>{outstandingLoans}</LoadingValue>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell scope="row">Outstanding Volume</TableCell>
                    <TableCell style={{ textAlign: 'end' }}>
                      <LoadingValue done={outstandingDebt !== undefined}>
                        {addThousandsSeparators(toPrecision(baseToDisplay(outstandingDebt || '0', 18), 2))} DAI
                      </LoadingValue>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell scope="row">Pool Reserve</TableCell>
                    <TableCell style={{ textAlign: 'end' }}>
                      <LoadingValue done={availableFunds !== undefined}>
                        {addThousandsSeparators(toPrecision(baseToDisplay(availableFunds || '0', 18), 2))} DAI
                      </LoadingValue>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Heading level="4" margin={{ top: 'large', bottom: 'small' }}>
                Investments
              </Heading>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell scope="row">Current TIN Risk Buffer</TableCell>
                    <TableCell style={{ textAlign: 'end' }}>
                      <LoadingValue done={currentJuniorRatio !== undefined}>
                        {addThousandsSeparators(toPrecision(baseToDisplay(currentJuniorRatio || '0', 25), 2))} %
                      </LoadingValue>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell scope="row">Minimum TIN Risk Buffer</TableCell>
                    <TableCell style={{ textAlign: 'end' }}>
                      <LoadingValue done={minJuniorRatio !== undefined}>
                        {addThousandsSeparators(toPrecision(baseToDisplay(minJuniorRatio || '0', 25), 2))} %
                      </LoadingValue>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell scope="row">DROP APR</TableCell>
                    <TableCell style={{ textAlign: 'end' }}>
                      <LoadingValue done={dropRate !== undefined}>
                        {toPrecision(feeToInterestRate(dropRate || '0'), 2)} %
                      </LoadingValue>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell scope="row">DROP Supply</TableCell>
                    <TableCell style={{ textAlign: 'end' }}>
                      <LoadingValue done={seniorTokenSupply !== undefined}>
                        {addThousandsSeparators(toPrecision(baseToDisplay(seniorTokenSupply || '0', 18), 2))} DROP
                      </LoadingValue>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell scope="row">TIN Supply</TableCell>
                    <TableCell style={{ textAlign: 'end' }}>
                      <LoadingValue done={juniorTokenSupply !== undefined}>
                        {addThousandsSeparators(toPrecision(baseToDisplay(juniorTokenSupply || '0', 18), 2))} TIN
                      </LoadingValue>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <Box margin={{ vertical: 'large' }}>
                <InvestAction pool={selectedPool} />
              </Box>
            </Box>
          </Box>
          <Box basis={'2/3'} margin={{ top: '0', left: 'large' }}>
            <div>
              <Heading level="4" margin={{ top: 'small' }}>
                Asset Originator Details
              </Heading>
              <a href={selectedPool.website} target="_blank">
                <img src={selectedPool.logo} style={{ maxHeight: '80px', maxWidth: '50%' }} />
              </a>

              <p>{selectedPool.text}</p>

              <p>
                {Object.keys(selectedPool.details).map((key: string) => (
                  <React.Fragment key={key}>
                    <strong>{key}:&nbsp;</strong> {selectedPool.details[key]}
                    <br />
                  </React.Fragment>
                ))}
              </p>

              {selectedPool.discourseLink && (
                <>
                  <h4 style={{ marginBottom: '0' }}>Learn more about this asset originator</h4>
                  <a href={selectedPool.discourseLink} target="_blank">
                    Join the discussion on Discourse
                  </a>
                </>
              )}
            </div>
          </Box>
        </Box>

        <Heading level="4" margin={{ top: 'xsmall' }}>
          Latest Assets
        </Heading>
        {loans!.loansState === 'loading' ? (
          <Spinner height={'calc(100vh - 89px - 84px)'} message={'Loading...'} />
        ) : (
          <LoanListData loans={latestLoans} userAddress={userAddress}>
            {' '}
          </LoanListData>
        )}
        <Box margin={{ top: 'medium', bottom: 'large' }} align="center">
          <PoolLink href={{ pathname: '/assets' }}>
            <Anchor>
              <Button label="View all assets" />
            </Anchor>
          </PoolLink>
        </Box>
      </Box>
    )
  }
}

export default Overview
