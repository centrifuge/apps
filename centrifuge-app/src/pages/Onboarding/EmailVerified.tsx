import { Box, IconCheckCircle, Shelf, Spinner } from '@centrifuge/fabric'
import React from 'react'
import { Container, Content, ContentHeader, Header, Layout } from '../../components/Onboarding'
import { config } from '../../config'
import { useVerifyEmail } from './queries/useVerifyEmail'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const [_, WordMark] = config.logo

export const EmailVerified: React.FC = () => {
  const { error, data } = useVerifyEmail()

  return (
    <Layout>
      <Header walletMenu={false} />

      <Container closeable={false}>
        <Content>
          {data || error ? (
            <>
              <ContentHeader
                title={data ? 'Thanks for verifying your email' : 'An error occurred'}
                body={data ? 'Please return to the original tab to continue with the onboarding process.' : undefined}
              />
              {data && (
                <Box>
                  <IconCheckCircle color="statusOk" size="iconLarge" />
                </Box>
              )}
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
