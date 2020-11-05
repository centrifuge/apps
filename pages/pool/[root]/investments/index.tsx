import * as React from 'react'
import InvestmentsViewUpcoming from '../../../../containers/Investment/ViewUpcoming'
import WithTinlake from '../../../../components/WithTinlake'
import { Box, Heading } from 'grommet'
import Header from '../../../../components/Header'
import { menuItems, noDemo } from '../../../../menuItems'
import SecondaryHeader from '../../../../components/SecondaryHeader'
import Auth from '../../../../components/Auth'
import WithFooter from '../../../../components/WithFooter'
import { WithRouterProps } from 'next/dist/client/with-router'
import config, { UpcomingPool } from '../../../../config'
import { GetStaticProps } from 'next'
import Container from '../../../../components/Container'
import Head from 'next/head'

interface Props extends WithRouterProps {
  root: string
  pool: UpcomingPool
}

class InvestmentPage extends React.Component<Props> {
  render() {
    const { pool } = this.props

    return (
      <WithFooter>
        <Head>
          <title>Investments: {pool.metadata.name} | Tinlake | Centrifuge</title>
        </Head>
        <Header
          poolTitle={pool.metadata.shortName || pool.metadata.name}
          selectedRoute={'/investments'}
          menuItems={menuItems.filter(noDemo)}
        />
        <Container>
          <Box justify="center" direction="row">
            <Box width="xlarge">
              <WithTinlake
                render={(tinlake) => (
                  <Auth
                    tinlake={tinlake}
                    render={() => (
                      <Box>
                        <SecondaryHeader>
                          <Heading level="3">Investments</Heading>
                        </SecondaryHeader>
                        <InvestmentsViewUpcoming pool={pool} />
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

export default InvestmentPage
