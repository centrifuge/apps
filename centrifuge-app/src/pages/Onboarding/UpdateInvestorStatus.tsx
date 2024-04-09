import { AnchorButton, Box, IconArrowUpRight, Shelf, Spinner } from '@centrifuge/fabric'
import React from 'react'
import { useLocation } from 'react-router-dom'
import { Container, Content, ContentHeader, Header, Layout } from '../../components/Onboarding'
import { ethConfig } from '../../config'
import { usePoolMetadata } from '../../utils/usePools'
import { useUpdateInvestorStatus } from './queries/useUpdateInvestorStatus'

export default function UpdateInvestorStatus() {
  const { search } = useLocation()
  const status = new URLSearchParams(search).get('status')
  const token = new URLSearchParams(search).get('token')
  const metadata = new URLSearchParams(search).get('metadata')
  const network = new URLSearchParams(search).get('network')

  const { data, isLoading } = useUpdateInvestorStatus()
  const { data: poolMetadata } = usePoolMetadata({ metadata: metadata || undefined })
  const poolName =
    // @ts-expect-error
    data && poolMetadata ? poolMetadata?.[data.poolId]?.metadata.name : poolMetadata ? poolMetadata.pool?.name : ''
  const blockExplorerUrl =
    network === 'evm' && data?.txHash
      ? `${ethConfig.blockExplorerUrl}/tx/${data.txHash}`
      : network === 'substrate' && data?.txHash
      ? `${import.meta.env.REACT_APP_SUBSCAN_URL}/extrinsic/${data.txHash}`
      : null
  return (
    <Layout>
      <Header walletMenu={false} />
      <Container closeable={false}>
        <Content>
          {data && poolMetadata && data && token ? (
            <>
              <ContentHeader
                title={`Investor was ${status}`}
                body={
                  status === 'approved'
                    ? `The investor has been notified that they are now eligible to invest into the ${poolName}.`
                    : `The investor has been notified that they have been rejected from investing in ${poolName}.`
                }
              />
              <Shelf gap={2}>
                <AnchorButton href="/" variant="primary">
                  Return to Centrifuge App
                </AnchorButton>
                {blockExplorerUrl && (
                  <AnchorButton
                    variant="tertiary"
                    iconRight={IconArrowUpRight}
                    href={`${blockExplorerUrl}`}
                    target="_blank"
                    small
                  >
                    Transaction
                  </AnchorButton>
                )}
              </Shelf>
            </>
          ) : isLoading ? (
            <>
              <ContentHeader
                title="Updating investor status"
                body={`The investor is being ${status} onchain. This may take a few seconds.`}
              />
              <Box>
                <Spinner size="iconLarge" />
              </Box>
            </>
          ) : (
            <>
              <ContentHeader title="An error occured" body="Please contact info@centrifuge.io for more information." />
            </>
          )}
        </Content>
      </Container>
    </Layout>
  )
}
