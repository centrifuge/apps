import { ITinlake } from '@centrifuge/tinlake-js'
import { Anchor, Box, Button, Heading } from 'grommet'
import * as React from 'react'
import { Pool, UpcomingPool } from '../../config'
import InvestmentOverview from '../../containers/Investment/View/InvestmentOverview'
import { PoolState } from '../../ducks/pool'
import PageTitle from '../PageTitle'
import OverviewHeader from './OverviewHeader'
import styled from 'styled-components'
import { Catalog, Chat, Link } from 'grommet-icons'
import { TwitterTimelineEmbed } from 'react-twitter-embed'

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

      <Box direction="row" gap="medium">
        <Box basis="2/3">
          <Heading level="4">
            {isUpcoming ? `Upcoming Pool: ${props.selectedPool.metadata.name}` : 'Asset Originator Details'}
          </Heading>
          <Box
            direction="column"
            justify="start"
            gap="medium"
            elevation="small"
            round="xsmall"
            pad="medium"
            margin={{ bottom: 'large' }}
            width="100%"
            height="100%"
            background="white"
          >
            <div>
              <img src={props.selectedPool.metadata.media?.logo} style={{ maxHeight: '60px', maxWidth: '40%' }} />
            </div>
            <p style={{ margin: '0' }}>{props.selectedPool.metadata.description}</p>
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

            <Box direction="row" gap="large">
              <Box style={{ textAlign: 'left' }}>
                <Heading level="5" margin={'0'}>
                  Consol Freight LLC
                </Heading>
                <Type>Asset Originator</Type>
              </Box>
              <Box style={{ textAlign: 'left' }}>
                <Heading level="5" margin={'0'}>
                  ConsolFreight Pilot LLC (Series 4)
                </Heading>
                <Type>Issuer</Type>
              </Box>
            </Box>
          </Box>
        </Box>
        <Box basis="1/3">
          <Heading level="4">
            Tweets by{' '}
            <a href="" target="_blank" style={{ textDecoration: 'none', color: '#000' }}>
              @NewSilverLend
            </a>
          </Heading>
          <Box
            elevation="small"
            round="xsmall"
            pad="small"
            margin={{ bottom: 'large' }}
            width="100%"
            height="100%"
            background="white"
          >
            <TwitterTimelineEmbed
              sourceType="profile"
              screenName="NewSilverLend"
              autoHeight
              noHeader
              noFooter
              noBorders
            />
          </Box>
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
