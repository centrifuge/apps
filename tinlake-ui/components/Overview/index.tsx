import { Modal } from '@centrifuge/axis-modal'
import { Heading, Paragraph } from 'grommet'
import { Catalog, Chat, Globe, StatusInfo as StatusInfoIcon } from 'grommet-icons'
import * as React from 'react'
import styled from 'styled-components'
import { Pool, UpcomingPool } from '../../config'
import InvestmentOverview from '../../containers/Investment/View/InvestmentOverview'
import { Button } from '../Button'
import { ButtonGroup } from '../ButtonGroup'
import { Card } from '../Card'
import InvestAction from '../InvestAction'
import { Box, Grid, Stack, Wrap } from '../Layout'
import PageTitle from '../PageTitle'
import { IconMail } from './IconMail'
import OverviewHeader from './OverviewHeader'

interface Props {
  selectedPool: Pool | UpcomingPool
}

function isUpcomingPool(pool: Pool | UpcomingPool): pool is UpcomingPool {
  return pool.isUpcoming === true
}

const Overview: React.FC<Props> = ({ selectedPool }) => {
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
    <Stack gap="xlarge" mt="xlarge">
      {!isUpcomingPool(selectedPool) && (
        <div>
          <PageTitle
            pool={selectedPool}
            page="Overview"
            rightContent={<Box display={['none', 'block']}>{<InvestAction pool={selectedPool} />}</Box>}
          />
          <OverviewHeader selectedPool={selectedPool as Pool} investButton={<InvestAction pool={selectedPool} />} />
        </div>
      )}
      {/* <Box direction="row" gap="small">
        <Box basis="2/3"> */}
      <div>
        <Heading level="4">
          {isUpcomingPool(selectedPool) ? `Upcoming Pool: ${selectedPool.metadata.name}` : 'Asset Originator Details'}
        </Heading>
        <Card p="medium">
          <Stack gap="medium">
            <div>
              <img
                alt="pool-logo"
                src={selectedPool.metadata.media?.logo}
                style={{ maxHeight: '60px', maxWidth: '30%' }}
              />
            </div>
            <p style={{ margin: '0' }}>{selectedPool.metadata.description}</p>

            <Grid gap="large" rowGap="medium" gridTemplateColumns="minmax(60px, min-content) auto">
              {selectedPool.metadata.attributes &&
                Object.entries(selectedPool.metadata.attributes).map(([key, attribute]) => (
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
                              <a href={value} target="_blank" rel="noreferrer">
                                <ButtonWithIcon
                                  label={label}
                                  icon={label.includes('Discussion') ? <Chat /> : <Globe />}
                                  size="small"
                                />
                              </a>
                            )}
                          </>
                        ))}

                        {selectedPool.metadata.issuerEmail && (
                          <a href={`mailto:${selectedPool.metadata.issuerEmail}`}>
                            <ButtonWithIcon label="Contact the issuer" icon={<IconMail />} size="small" />
                          </a>
                        )}
                      </Wrap>
                    )}
                  </>
                ))}
            </Grid>
          </Stack>
        </Card>
      </div>

      <div>
        <Heading level="4">Pool Status</Heading>
        <InvestmentOverview selectedPool={selectedPool} />
      </div>

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
          {selectedPool.metadata.shortName || selectedPool.metadata.name} or any affiliate.&nbsp;
        </Paragraph>
        <ButtonGroup>
          <a href={modalLink} target="_blank" rel="noreferrer">
            <Button primary onClick={closeModal} label="View the Executive Summary" fill={true} />
          </a>
        </ButtonGroup>
      </Modal>
    </Stack>
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
`
