import { Modal } from '@centrifuge/axis-modal'
import { ITinlake } from '@centrifuge/tinlake-js'
import { Box, Button, Heading, Paragraph } from 'grommet'
import { Catalog, Chat, Globe, StatusInfo as StatusInfoIcon } from 'grommet-icons'
import * as React from 'react'
import styled from 'styled-components'
import { Pool, UpcomingPool } from '../../config'
import InvestmentOverview from '../../containers/Investment/View/InvestmentOverview'
import { Card } from '../Card'
import { Grid, Stack, Wrap } from '../Layout'
import PageTitle from '../PageTitle'
import OverviewHeader from './OverviewHeader'

interface Props {
  selectedPool: Pool | UpcomingPool
  tinlake: ITinlake
}

const Overview: React.FC<Props> = (props: Props) => {
  const isUpcoming = props.selectedPool?.isUpcoming === true

  const [modalLink, setModalLink] = React.useState('')
  const [modalIsOpen, setModalIsOpen] = React.useState(false)

  const openModal = (link: string) => {
    setModalLink(link)
    setModalIsOpen(true)
  }
  const closeModal = () => {
    setModalIsOpen(false)
  }

  return (
    <Box margin={{ bottom: 'large', top: 'medium' }}>
      {!isUpcoming && (
        <>
          <PageTitle pool={props.selectedPool} page="Overview" />
          <OverviewHeader selectedPool={props.selectedPool as Pool} tinlake={props.tinlake} />
        </>
      )}
      {/* <Box direction="row" gap="small">
        <Box basis="2/3"> */}
      <Heading level="4">
        {isUpcoming ? `Upcoming Pool: ${props.selectedPool.metadata.name}` : 'Asset Originator Details'}
      </Heading>
      <Card p="small">
        <Stack gap="medium">
          <div>
            <img src={props.selectedPool.metadata.media?.logo} style={{ maxHeight: '60px', maxWidth: '30%' }} />
          </div>
          <p style={{ margin: '0' }}>{props.selectedPool.metadata.description}</p>

          <Grid gap="large" rowGap="medium" gridTemplateColumns="80px auto">
            {props.selectedPool.metadata.attributes &&
              Object.entries(props.selectedPool.metadata.attributes).map(([key, attribute]) => (
                <>
                  <Type>{key}</Type>
                  {typeof attribute === 'string' ? (
                    <Heading level="6" margin={'0'}>
                      {attribute}
                    </Heading>
                  ) : (
                    <Wrap gap="small" rowGap="xsmall" mt={-4}>
                      {Object.entries(attribute).map(([label, value]) => (
                        <>
                          {label === 'Executive Summary' ? (
                            <ButtonWithIcon
                              label={label}
                              icon={<Catalog />}
                              size="small"
                              onClick={() => openModal(value)}
                            />
                          ) : (
                            <a href={value} target="_blank">
                              <ButtonWithIcon
                                label={label}
                                icon={label.includes('Discussion') ? <Chat /> : <Globe />}
                                size="small"
                              />
                            </a>
                          )}
                        </>
                      ))}
                    </Wrap>
                  )}
                </>
              ))}
          </Grid>
        </Stack>
      </Card>
      {/* </Box>{' '} */}
      {/* <Box basis="1/3">
          <Heading level="4">Tweets by @NewSilverLend</Heading>
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
      </Box> */}

      <Heading level="4">Pool Balance</Heading>
      <InvestmentOverview selectedPool={props.selectedPool} tinlake={props.tinlake} />

      <Modal
        opened={modalIsOpen}
        title={
          'Confirmation that your are requesting the executive summary without having being solicited or approached by the issuer.'
        }
        style={{ maxWidth: '800px' }}
        headingProps={{ style: { maxWidth: '100%', display: 'flex' } }}
        titleIcon={<StatusInfoIcon />}
        onClose={closeModal}
      >
        <Paragraph margin={{ top: 'medium', bottom: 'large' }}>
          By clicking on the button below, you are confirming that you are requesting the executive summary without
          having being solicited or approached, directly or indirectly by the issuer of{' '}
          {props.selectedPool.metadata.shortName || props.selectedPool.metadata.name} or any affiliate.&nbsp;
        </Paragraph>
        <Box direction="row" justify="end">
          <Box basis={'1/5'}>
            <a href={modalLink} target="_blank">
              <Button primary onClick={closeModal} label="View the Executive Summary" fill={true} />
            </a>
          </Box>
        </Box>
      </Modal>
    </Box>
  )
}

export default Overview

const ButtonWithIcon = styled(Button)`
  border-radius: 6px;
  font-size: 13px;
  padding: 2px 12px;
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
  line-height: 18px;
  color: #979797;
  width: 80px;
`
