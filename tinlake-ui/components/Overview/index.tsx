import { ITinlake } from '@centrifuge/tinlake-js'
import { Anchor, Box, Button, Heading, Table, TableBody, TableCell, TableRow } from 'grommet'
import * as React from 'react'
import InvestAction from '../../components/InvestAction'
import OnboardModal from '../../components/OnboardModal'
import { PoolLink } from '../../components/PoolLink'
import PoolTitle from '../../components/PoolTitle'
import config, { Pool, UpcomingPool } from '../../config'
import InvestmentOverview from '../../containers/Investment/View/InvestmentOverview'
import { PoolState } from '../../ducks/pool'

interface Props {
  pool?: PoolState
  selectedPool: Pool | UpcomingPool
  tinlake: ITinlake
}

const Overview: React.FC<Props> = (props: Props) => {
  const isUpcoming = props.selectedPool?.isUpcoming === true

  return (
    <Box margin={{ bottom: 'large', top: 'medium' }}>
      {!isUpcoming && (
        <>
          <PoolTitle pool={props.selectedPool} page="Pool Overview" />
          <InvestmentOverview selectedPool={props.selectedPool} tinlake={props.tinlake} />
        </>
      )}

      <Heading level="4">
        {isUpcoming ? `Upcoming Pool: ${props.selectedPool.metadata.name}` : 'Asset Originator Details'}
      </Heading>
      <Box
        direction="row"
        justify="between"
        gap="medium"
        elevation="small"
        round="xsmall"
        pad="medium"
        background="white"
      >
        <Box basis="1/2">
          <a href={props.selectedPool.metadata.website} target="_blank">
            <img src={props.selectedPool.metadata.media?.logo} style={{ maxHeight: '80px', maxWidth: '50%' }} />
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

          {!isUpcoming && (
            <Box margin={{ top: 'medium', left: 'auto' }}>
              <PoolLink href={{ pathname: '/assets' }}>
                <Anchor>
                  <Button label="View all assets" />
                </Anchor>
              </PoolLink>
            </Box>
          )}

          {isUpcoming && (
            <Box margin={{ top: 'medium' }}>
              {config.featureFlagNewOnboarding ? (
                <OnboardModal pool={props.selectedPool} />
              ) : (
                <InvestAction pool={props.selectedPool} />
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default Overview
