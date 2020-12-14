import { Box, Button, Heading } from 'grommet'
import { GetStaticProps } from 'next'
import { WithRouterProps } from 'next/dist/client/with-router'
import Head from 'next/head'
import * as React from 'react'
import Auth from '../../../../../components/Auth'
import Container from '../../../../../components/Container'
import Header from '../../../../../components/Header'
import { PoolLink } from '../../../../../components/PoolLink'
import WithFooter from '../../../../../components/WithFooter'
import WithTinlake from '../../../../../components/WithTinlake'
import { IpfsPools, loadPoolsFromIPFS, Pool } from '../../../../../config'
import LoanList from '../../../../../containers/Loan/List'
import LoanOverview from '../../../../../containers/Loan/Overview/index'
import { menuItems } from '../../../../../menuItems'

interface Props extends WithRouterProps {
  root: string
  pool: Pool
  ipfsPools: IpfsPools
}

class LoanListPage extends React.Component<Props> {
  render() {
    const { pool, ipfsPools } = this.props

    return (
      <WithFooter>
        <Head>
          <title>Assets: {pool.metadata.name} | Tinlake | Centrifuge</title>
        </Head>
        <Header
          ipfsPools={ipfsPools}
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
                        <Box direction="row" margin={{ top: 'medium' }} justify="between">
                          <Heading level="4">Asset Overview of {pool.metadata.name}</Heading>
                          <Box pad={{ top: 'small' }}>
                            <PoolLink href={'/assets/issue'}>
                              <Button primary label="Lock NFT" />
                            </PoolLink>
                          </Box>
                        </Box>

                        <LoanOverview tinlake={tinlake} auth={auth} activePool={this.props.pool} />
                        <Heading level="4">Asset List</Heading>
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
  return { props: { root: params?.root, pool: pools.active.find((p) => p.addresses.ROOT_CONTRACT === params?.root), ipfsPools: pools} }
}

export default LoanListPage
