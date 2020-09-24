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

interface Props {
  userAddress: string
  loans?: LoansState
  pool?: PoolState
  selectedPool: Pool | UpcomingPool
}

class Overview extends React.Component<Props> {
  render() {
    const { userAddress, loans, selectedPool, pool } = this.props

    const allLoans = (loans && loans.loans) || []
    const poolData = pool && pool.data

    const outstandingLoans = allLoans.filter((loan) => loan.status && loan.status === 'ongoing').length
    const outstandingDebt = allLoans.map((loan) => loan.debt).reduce((sum, debt) => sum.add(debt), new BN('0'))
    const availableFunds = poolData?.availableFunds || '0'
    const minJuniorRatio = poolData?.minJuniorRatio || '0'
    const currentJuniorRatio = poolData?.currentJuniorRatio || '0'
    const dropRate = (poolData && poolData.senior && poolData.senior.interestRate) || '0'
    const seniorTokenSupply = (poolData && poolData.senior && poolData.senior.totalSupply) || '0'
    const juniorTokenSupply = (poolData && poolData.junior.totalSupply) || '0'

    // show just recent 10 assets
    const startIndex = allLoans.length >= 10 ? allLoans.length - 10 : 0
    const latestLoans = allLoans.slice(startIndex, allLoans.length)

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
                    <TableCell style={{ textAlign: 'end' }}> {outstandingLoans} </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell scope="row">Outstanding Volume</TableCell>
                    <TableCell style={{ textAlign: 'end' }}>
                      {addThousandsSeparators(toPrecision(baseToDisplay(outstandingDebt, 18), 2))} DAI
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell scope="row">Pool Reserve</TableCell>
                    <TableCell style={{ textAlign: 'end' }}>
                      {addThousandsSeparators(toPrecision(baseToDisplay(availableFunds, 18), 2))} DAI
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
                      {addThousandsSeparators(toPrecision(baseToDisplay(currentJuniorRatio, 25), 2))} %
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell scope="row">Minimum TIN Risk Buffer</TableCell>
                    <TableCell style={{ textAlign: 'end' }}>
                      {addThousandsSeparators(toPrecision(baseToDisplay(minJuniorRatio, 25), 2))} %
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell scope="row">DROP APR</TableCell>
                    <TableCell style={{ textAlign: 'end' }}>{toPrecision(feeToInterestRate(dropRate), 2)} %</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell scope="row">DROP Supply</TableCell>
                    <TableCell style={{ textAlign: 'end' }}>
                      {addThousandsSeparators(toPrecision(baseToDisplay(seniorTokenSupply, 18), 2))} DROP
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell scope="row">TIN Supply</TableCell>
                    <TableCell style={{ textAlign: 'end' }}>
                      {addThousandsSeparators(toPrecision(baseToDisplay(juniorTokenSupply, 18), 2))} TIN
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <Box margin={{ vertical: 'large' }}>
                <InvestAction poolName={selectedPool.name} />
              </Box>
            </Box>
          </Box>
          <Box basis={'2/3'} margin={{ left: 'large' }}>
            {!selectedPool.isUpcoming && selectedPool.description && (
              <div dangerouslySetInnerHTML={{ __html: selectedPool.description }} />
            )}

            {(selectedPool.isUpcoming || !selectedPool.description) && (
              <div>
                <h4>Asset Originator Details</h4>
                <p>The following information was provided by the Asset Originator.</p>
                <a href={selectedPool.website} target="_blank">
                  <img src={selectedPool.logo} width="275px" />
                </a>

                <p>{selectedPool.text}</p>

                <h4>Pool Details</h4>
                <p>
                  {Object.keys(selectedPool.details).map((key: string) => (
                    <React.Fragment key={key}>
                      <strong>{key}:</strong> {selectedPool.details[key]}
                      <br />
                    </React.Fragment>
                  ))}
                </p>

                {(selectedPool.website ||
                  selectedPool.email ||
                  (selectedPool.additionalContactInfo && selectedPool.additionalContactInfo.length > 0)) && (
                  <p>
                    <strong>Interested in investing or want to learn more?</strong>
                    {selectedPool.website && (
                      <>
                        <br />
                        <a href={selectedPool.website} target="_blank">
                          {new URL(selectedPool.website).hostname}
                        </a>
                      </>
                    )}
                    {selectedPool.email && (
                      <>
                        <br />
                        <a href={`mailto:${selectedPool.email}`} target="_blank">
                          {selectedPool.email}
                        </a>
                      </>
                    )}
                    {selectedPool.additionalContactInfo?.map((ci, i) =>
                      ci.link ? (
                        <React.Fragment key={ci.label + i}>
                          <br />
                          <a href={ci.link} target="_blank">
                            {ci.label}
                          </a>
                        </React.Fragment>
                      ) : (
                        <React.Fragment key={ci.label + i}>
                          <br />
                          <span>{ci.label}</span>
                        </React.Fragment>
                      )
                    )}
                  </p>
                )}
              </div>
            )}
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
