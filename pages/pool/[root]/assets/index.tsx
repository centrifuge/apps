import * as React from 'react'
import WithTinlake from '../../../../components/WithTinlake'
import { Box, Heading } from 'grommet'
import Header from '../../../../components/Header'
import { menuItems, noDemo } from '../../../../menuItems'
import SecondaryHeader from '../../../../components/SecondaryHeader'
import Auth from '../../../../components/Auth'
import WithFooter from '../../../../components/WithFooter'
import { WithRouterProps } from 'next/dist/client/with-router'
import config, { Pool } from '../../../../config'
import { GetStaticProps } from 'next'
import Container from '../../../../components/Container'
import Head from 'next/head'
import LoanListUpcoming from '../../../../containers/Loan/ListUpcoming'

interface Props extends WithRouterProps {
  root: string
  pool: Pool
}

class LoanListPage extends React.Component<Props> {
  render() {
    const { pool } = this.props

    return (
      <WithFooter>
        <Head>
          <title>Assets: {pool.metadata.name} | Tinlake | Centrifuge</title>
        </Head>
        <Header
          poolTitle={pool.metadata.shortName || pool.metadata.name}
          selectedRoute={'/assets'}
          menuItems={menuItems.filter(noDemo)}
        />
        <Container>
          <Box justify="evenly" direction="row">
            <Box width="xlarge" gap="medium">
              <WithTinlake
                version={pool.version}
                addresses={pool.addresses}
                contractConfig={pool.contractConfig}
                render={(tinlake) => (
                  <Auth
                    tinlake={tinlake}
                    render={() => (
                      <Box>
                        <SecondaryHeader>
                          <Heading level="3">Assets</Heading>
                        </SecondaryHeader>
                        <LoanListUpcoming />
                      </Box>
                    )}
                  />
                )}
              />
            </Box>
          </Box>
        </Container>
      </WithFooter>
    )
  }
}

export async function getStaticPaths() {
  // We'll pre-render only these paths at build time.
  const paths = config.upcomingPools.map((pool) => ({ params: { root: pool.metadata.slug } }))

  // { fallback: false } means other routes should 404.
  return { paths, fallback: false }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  return { props: { root: params?.root, pool: config.upcomingPools.find((p) => p.metadata.slug === params?.root) } }
}

export default LoanListPage
