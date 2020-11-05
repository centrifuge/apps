import * as React from 'react'
import LoanList from '../../../../../containers/Loan/List'
import WithTinlake from '../../../../../components/WithTinlake'
import { Box, Heading, Button } from 'grommet'
import Header from '../../../../../components/Header'
import { menuItems } from '../../../../../menuItems'
import SecondaryHeader from '../../../../../components/SecondaryHeader'
import Auth from '../../../../../components/Auth'
import { PoolLink } from '../../../../../components/PoolLink'
import WithFooter from '../../../../../components/WithFooter'
import { WithRouterProps } from 'next/dist/client/with-router'
import config, { Pool } from '../../../../../config'
import { GetStaticProps } from 'next'
import Container from '../../../../../components/Container'
import Head from 'next/head'
import { isTinlakeV3 } from '../../../../../utils/tinlakeVersion'
import LoanOverview from '../../../../../containers/Loan/Overview/index'

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
          menuItems={menuItems}
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
                    render={(auth) => (
                      <Box>
                        <SecondaryHeader margin={{ top: 'medium' }}>
                          <Heading level="4">Asset Overview of {pool.metadata.name}</Heading>
                          <PoolLink href={'/assets/issue'}>
                            <Button primary label="Open Financing" />
                          </PoolLink>
                        </SecondaryHeader>

                        {isTinlakeV3(tinlake) && (
                          <>
                            <LoanOverview tinlake={tinlake} auth={auth} activePool={this.props.pool} />
                          </>
                        )}
                        <LoanList tinlake={tinlake} auth={auth} hideMetrics={isTinlakeV3(tinlake)} />
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
  const paths = config.pools.map((pool) => ({
    params: { root: pool.addresses.ROOT_CONTRACT, slug: pool.metadata.slug },
  }))

  // { fallback: false } means other routes should 404.
  return { paths, fallback: false }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  return { props: { root: params?.root, pool: config.pools.find((p) => p.addresses.ROOT_CONTRACT === params?.root) } }
}

export default LoanListPage
