import { AnchorButton, Box, Shelf, Spinner } from '@centrifuge/fabric'
import React from 'react'
import { useLocation } from 'react-router-dom'
import { Container, Content, ContentHeader, Header, Layout } from '../../components/Onboarding'
import { config } from '../../config'
import { useUpdateInvestorStatus } from './queries/useUpdateInvestorStatus'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const [_, WordMark] = config.logo

export const UpdateInvestorStatus: React.FC = () => {
  const { search } = useLocation()
  const status = new URLSearchParams(search).get('status')
  const token = new URLSearchParams(search).get('token')

  const { data, error } = useUpdateInvestorStatus()
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
                  data && token
                    ? `The investor has been notified that they are now eligible to invest into ${token}`
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
