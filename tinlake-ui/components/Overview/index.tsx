import { ITinlake } from '@centrifuge/tinlake-js'
import { Anchor, Box, Button, Heading } from 'grommet'
import * as React from 'react'
import InvestAction from '../../components/InvestAction'
import { Pool, UpcomingPool } from '../../config'
import InvestmentOverview from '../../containers/Investment/View/InvestmentOverview'
import { PoolState } from '../../ducks/pool'
import PageTitle from '../PageTitle'
import OverviewHeader from './OverviewHeader'
import styled from 'styled-components'
import { Catalog, Chat, Link } from 'grommet-icons'

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
          <PageTitle pool={props.selectedPool} page="Overview" />
          <OverviewHeader selectedPool={props.selectedPool as Pool} tinlake={props.tinlake} />
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
        margin={{ bottom: 'large' }}
        width="100%"
        background="white"
      >
        <Box width="400px" style={{ textAlign: 'center' }} margin={{ right: 'medium', top: '20px' }}>
          <a href={props.selectedPool.metadata.website} target="_blank">
            <img src={props.selectedPool.metadata.media?.logo} style={{ maxHeight: '60px', maxWidth: '50%' }} />
          </a>
          <Box pad={{ top: 'large', bottom: 'medium' }} style={{ borderBottom: '1px solid #d8d8d8' }}>
            <Heading level="5" margin={'0'}>
              Consol Freight LLC
            </Heading>
            <Type>Asset Originator</Type>
          </Box>
          <Box pad={{ top: 'medium', bottom: 'medium' }}>
            <Heading level="5" margin={'0'}>
              ConsolFreight Pilot LLC (Series 4)
            </Heading>
            <Type>Issuer</Type>
          </Box>

          {isUpcoming && (
            <Box margin={{ top: 'medium' }}>
              <InvestAction pool={props.selectedPool} />
            </Box>
          )}
        </Box>
        <Box basis="2/3">
          <p>{props.selectedPool.metadata.description}</p>

          <div>
            <AOButton>
              <Anchor>
                <ButtonWithIcon label="Executive Summary" icon={<Catalog />} size="small" />
              </Anchor>
            </AOButton>
            <AOButton>
              <Anchor>
                <ButtonWithIcon label="Discussion on Discourse" icon={<Chat />} size="small" />
              </Anchor>
            </AOButton>
            <AOButton>
              <Anchor>
                <ButtonWithIcon label="Website" icon={<Link />} size="small" />
              </Anchor>
            </AOButton>
          </div>
        </Box>
      </Box>
      <Heading level="4">Pool Balance</Heading>
      <InvestmentOverview selectedPool={props.selectedPool} tinlake={props.tinlake} />
    </Box>
  )
}

export default Overview

const AOButton = styled.div`
  display: inline-block;
  margin: 0 20px 20px 0;
`

const ButtonWithIcon = styled(Button)`
  border-radius: 6px;
  font-size: 13px;
  padding: 6px 12px;
  background: #eee;
  border: none;
  svg {
    width: 14px;
    height: 14px;
  }
`

const Type = styled.div`
  font-weight: 500;
  font-size: 13px;
  line-height: 14px;
  color: #979797;
`
