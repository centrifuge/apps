import { Spinner } from '@centrifuge/axis-spinner'
import { Anchor, Box, Button, Heading } from 'grommet'
import * as React from 'react'
import LoanListData from '../../components/Loan/List'
import { PoolLink } from '../../components/PoolLink'
import { Pool, UpcomingPool } from '../../config'
import { LoansState } from '../../ducks/loans'
import PoolOverviewTable from './PoolOverviewTable'

interface Props {
  userAddress: string
  loans?: LoansState
  selectedPool: Pool | UpcomingPool
}

const Overview: React.FC<Props> = (props: Props) => {
  const isUpcoming = 'isUpcoming' in props.selectedPool && props.selectedPool.isUpcoming === true
  const allLoans = (props.loans && props.loans.loans) || undefined

  // show just recent 10 assets
  const startIndex = allLoans ? (allLoans.length >= 10 ? allLoans.length - 10 : 0) : undefined
  const latestLoans = allLoans ? allLoans.slice(startIndex, allLoans.length) : []

  return (
    <Box margin={{ bottom: 'large', top: 'medium' }}>
      <Heading level="4">Pool Overview of {props.selectedPool.metadata.name} </Heading>
      <Box direction="row" margin={{ bottom: 'large' }}>
        <PoolOverviewTable selectedPool={props.selectedPool} />

        <Box basis={'2/3'} margin={{ top: '0', left: 'large' }}>
          <div>
            <Heading level="5" margin={{ top: 'small' }}>
              Asset Originator Details
            </Heading>
            <a href={props.selectedPool.metadata.website} target="_blank">
              <img src={props.selectedPool.metadata.media?.logo} style={{ maxHeight: '80px', maxWidth: '50%' }} />
            </a>

            <p>{props.selectedPool.metadata.description}</p>

            <p>
              {Object.keys(props.selectedPool.metadata.details).map((key: string) => (
                <React.Fragment key={key}>
                  <strong>{key}:&nbsp;</strong> {props.selectedPool.metadata.details[key]}
                  <br />
                </React.Fragment>
              ))}
            </p>

            {props.selectedPool.metadata.discourseLink && (
              <>
                <h4 style={{ marginBottom: '0' }}>Learn more about this asset originator</h4>
                <a href={props.selectedPool.metadata.discourseLink} target="_blank">
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
          {props.loans!.loansState === 'loading' ? (
            <Spinner height={'calc(100vh - 89px - 84px)'} message={'Loading...'} />
          ) : (
            <LoanListData loans={latestLoans} userAddress={props.userAddress}>
              {' '}
            </LoanListData>
          )}
          <Box margin={{ top: 'medium', bottom: 'large' }} align="center">
            <PoolLink href={'/assets'}>
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

export default Overview
