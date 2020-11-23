import * as React from 'react'
import { Spinner } from '@centrifuge/axis-spinner'
import { Box, Heading, Button, Anchor } from 'grommet'

import { PoolState } from '../../ducks/pool'
import { LoansState } from '../../ducks/loans'
import LoanListData from '../../components/Loan/List'
import { Pool, UpcomingPool } from '../../config'
import { PoolLink } from '../../components/PoolLink'
import PoolOverviewTable from './PoolOverviewTable'

interface Props {
  userAddress: string
  loans?: LoansState
  pool?: PoolState
  selectedPool: Pool | UpcomingPool
}

class Overview extends React.Component<Props> {
  render() {
    const { userAddress, loans, selectedPool } = this.props

    const allLoans = (loans && loans.loans) || undefined

    // show just recent 10 assets
    const startIndex = allLoans ? (allLoans.length >= 10 ? allLoans.length - 10 : 0) : undefined
    const latestLoans = allLoans ? allLoans.slice(startIndex, allLoans.length) : []

    const isUpcoming = 'isUpcoming' in selectedPool && selectedPool.isUpcoming === true

    return (
      <Box margin={{ bottom: 'large', top: 'medium' }}>
        <Heading level="4">Pool Overview of {selectedPool.metadata.name} </Heading>
        <Box direction="row" margin={{ bottom: 'large' }}>
          <PoolOverviewTable selectedPool={this.props.selectedPool} />

          <Box basis={'2/3'} margin={{ top: '0', left: 'large' }}>
            <div>
              <Heading level="5" margin={{ top: 'small' }}>
                Asset Originator Details
              </Heading>
              <a href={selectedPool.metadata.website} target="_blank">
                <img src={selectedPool.metadata.logo} style={{ maxHeight: '80px', maxWidth: '50%' }} />
              </a>

              <p>{selectedPool.metadata.description}</p>

              <p>
                {Object.keys(selectedPool.metadata.details).map((key: string) => (
                  <React.Fragment key={key}>
                    <strong>{key}:&nbsp;</strong> {selectedPool.metadata.details[key]}
                    <br />
                  </React.Fragment>
                ))}
              </p>

              {selectedPool.metadata.discourseLink && (
                <>
                  <h4 style={{ marginBottom: '0' }}>Learn more about this asset originator</h4>
                  <a href={selectedPool.metadata.discourseLink} target="_blank">
                    Join the discussion on Discourse
                  </a>
                </>
              )}
            </div>
          </Box>
        </Box>
        {!isUpcoming && (
          <>
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
          </>
        )}
      </Box>
    )
  }
}

export default Overview
