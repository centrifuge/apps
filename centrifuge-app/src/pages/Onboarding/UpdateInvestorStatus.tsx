import { AnchorButton, Box, Shelf, Spinner } from '@centrifuge/fabric'
import React from 'react'
import { useLocation } from 'react-router-dom'
import { Container, Content, ContentHeader, Header, Layout } from '../../components/Onboarding'
import { usePoolMetadata } from '../../utils/usePools'
import { useUpdateInvestorStatus } from './queries/useUpdateInvestorStatus'

export const UpdateInvestorStatus: React.FC = () => {
  const { search } = useLocation()
  const status = new URLSearchParams(search).get('status')
  const token = new URLSearchParams(search).get('token')
  const metadata = new URLSearchParams(search).get('metadata')

  const { data, error } = useUpdateInvestorStatus()
  const { data: poolMetadata } = usePoolMetadata({ metadata: metadata || undefined })
  return (
    <Layout>
      <Header walletMenu={false} />

      <Container closeable={false}>
        <Content>
          {data || error ? (
            <>
              <ContentHeader
                title={data ? `Investor was ${status}` : 'An error occurred'}
                body={
                  metadata && poolMetadata?.tranches && data && token
                    ? `The investor has been notified that they are now eligible to invest into the ${poolMetadata.pool?.name}`
                    : undefined
                }
              />
              <Box>
                <AnchorButton href="/" variant="primary">
                  Return to Centrifuge App
                </AnchorButton>
              </Box>
            </>
          ) : (
            <Shelf height="100%" justifyContent="center" alignItems="center">
              <Spinner size="iconLarge" />
            </Shelf>
          )}
        </Content>
      </Container>
    </Layout>
  )
}
