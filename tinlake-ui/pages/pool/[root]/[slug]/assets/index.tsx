import { Box, Button, Heading } from 'grommet'
import { GetStaticProps } from 'next'
import { WithRouterProps } from 'next/dist/client/with-router'
import Head from 'next/head'
import * as React from 'react'
import Auth from '../../../../../components/Auth'
import Container from '../../../../../components/Container'
import Header from '../../../../../components/Header'
import { PoolLink } from '../../../../../components/PoolLink'
import SecondaryHeader from '../../../../../components/SecondaryHeader'
import WithFooter from '../../../../../components/WithFooter'
import WithTinlake from '../../../../../components/WithTinlake'
import config, { loadPoolsFromIPFS, Pool } from '../../../../../config'
import LoanList from '../../../../../containers/Loan/List'
import LoanOverview from '../../../../../containers/Loan/Overview/index'
import { menuItems } from '../../../../../menuItems'

interface Props extends WithRouterProps {
  root: string
  pool: Pool
  pools: any
}

class LoanListPage extends React.Component<Props> {
  render() {
    const { pools, pool } = this.props

    console.log("POOLS IN LOAN LIST", pools)

    return (
      <WithFooter>
        <Head>
          <title>Assets: {pool.metadata.name} | Tinlake | Centrifuge</title>
        </Head>
        <Header
          poolTitle={pool.metadata.shortName || pool.metadata.name}
          selectedRoute={'/assets'}
          menuItems={menuItems}
        />
        <Container>
          <Box justify="evenly" direction="row">
            <Box width="xlarge" gap="medium">
              <WithTinlake
                addresses={pool.addresses}
                contractConfig={pool.contractConfig}
                render={(tinlake) => (
                  <Auth
                    tinlake={tinlake}
                    render={(auth) => (
                      <Box>
                        <SecondaryHeader margin={{ top: 'medium' }}>
                          <Heading level="4">Asset Overview of {pool.metadata.name}</Heading>
                          <PoolLink href={'/assets/issue'} configPools={pools.active}>
                            <Button primary label="Open Financing" />
                          </PoolLink>
                        </SecondaryHeader>

                        <LoanOverview tinlake={tinlake} auth={auth} activePool={this.props.pool} />
                        <LoanList tinlake={tinlake} auth={auth} hideMetrics={true} />
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
  const pools = await loadPoolsFromIPFS()
  const paths = pools.active.map((pool) => ({
    params: { root: pool.addresses.ROOT_CONTRACT, slug: pool.metadata.slug },
  }))

  // { fallback: false } means other routes should 404.
  return { paths, fallback: false }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const pools = await loadPoolsFromIPFS()
  return { props: { root: params?.root, pool: pools.active.find((p) => p.addresses.ROOT_CONTRACT === params?.root) } }
}

export default LoanListPage
