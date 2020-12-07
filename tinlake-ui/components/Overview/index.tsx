import { Anchor, Button, Box, Heading, Table, TableBody, TableCell, TableRow } from 'grommet'
import * as React from 'react'
import { Pool, UpcomingPool } from '../../config'
import InvestmentOverview from '../../containers/Investment/View/InvestmentOverview'
import { PoolState } from '../../ducks/pool'
import { useSelector } from 'react-redux'
import { LoansState } from '../../ducks/loans'
import { PoolLink } from '../../components/PoolLink'

interface Props {
  pool?: PoolState
  selectedPool: Pool | UpcomingPool
}

const Overview: React.FC<Props> = (props: Props) => {
  const loans = useSelector<any, LoansState>((state) => state.loans)
  const outstandingLoans = loans?.loans
    ? loans?.loans.filter((loan) => loan.status && loan.status === 'ongoing').length
    : undefined

  return (
    <Box margin={{ bottom: 'large', top: 'medium' }}>
      <Heading level="4">Pool Overview of {props.selectedPool.metadata.name} </Heading>
      <InvestmentOverview selectedPool={props.selectedPool} />

      <Box direction="row" justify="between" gap="medium" margin={{ top: 'medium', bottom: 'medium' }}>
        <Box basis="1/2">
          <Heading level="4">Asset Originator Details</Heading>
          <a href={props.selectedPool.metadata.website} target="_blank">
            <img src={props.selectedPool.metadata.logo} style={{ maxHeight: '80px', maxWidth: '50%' }} />
          </a>

          <p>{props.selectedPool.metadata.description}</p>

          {props.selectedPool.metadata.discourseLink && (
            <>
              <h4 style={{ marginBottom: '0' }}>Learn more about this asset originator</h4>
              <a href={props.selectedPool.metadata.discourseLink} target="_blank">
                Join the discussion on Discourse
              </a>
            </>
          )}
        </Box>
        <Box width="420px">
          <Heading level="4">{outstandingLoans || 0} Active Assets</Heading>
          <Table>
            <TableBody>
              {Object.keys(props.selectedPool.metadata.details).map((key: string) => (
                <TableRow key={key}>
                  <TableCell scope="row" style={{ alignItems: 'start', justifyContent: 'center' }}>
                    {key}
                  </TableCell>
                  <TableCell style={{ textAlign: 'end' }}>{props.selectedPool.metadata.details[key]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Box margin={{ top: 'medium', left: 'auto' }}>
            <PoolLink href={{ pathname: '/assets' }}>
              <Anchor>
                <Button label="View all assets" />
              </Anchor>
            </PoolLink>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default Overview
