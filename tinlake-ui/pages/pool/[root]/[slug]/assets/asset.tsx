import { Box, Heading } from 'grommet'
import { GetStaticProps } from 'next'
import { WithRouterProps } from 'next/dist/client/with-router'
import Head from 'next/head'
import { withRouter } from 'next/router'
import * as React from 'react'
import Auth from '../../../../../components/Auth'
import { BackLink } from '../../../../../components/BackLink'
import Container from '../../../../../components/Container'
import Header from '../../../../../components/Header'
import WithFooter from '../../../../../components/WithFooter'
import WithTinlake from '../../../../../components/WithTinlake'
import config, { Pool } from '../../../../../config'
import LoanView from '../../../../../containers/Loan/View'
import { menuItems } from '../../../../../menuItems'

interface Props extends WithRouterProps {
  root: string
  pool: Pool
}

class LoanPage extends React.Component<Props> {
  render() {
    const { pool } = this.props
    const { assetId }: { assetId: string } = this.props.router.query as any

    return (
      <WithFooter>
        <Head>
          <title>
            Asset {assetId}: {pool.metadata.name} | Tinlake | Centrifuge | Decentralized Asset Financing
          </title>
        </Head>
        <Header
          poolTitle={pool.metadata.shortName || pool.metadata.name}
          selectedRoute={'/assets/asset'}
          menuItems={menuItems}
        />
        <Container>
          <Box justify="center" direction="row">
            <Box width="xlarge" margin={{ top: 'medium' }}>
              <Box direction="row" gap="small" align="center">
                <BackLink href={'/assets'} />
                <Heading level="4">Asset Details</Heading>
              </Box>
              <WithTinlake
                addresses={pool.addresses}
                contractConfig={pool.contractConfig}
                render={(tinlake) => (
                  <Auth
                    tinlake={tinlake}
                    render={(auth) => (
                      <Box>
                        {assetId && <LoanView auth={auth} tinlake={tinlake} poolConfig={pool} loanId={assetId} />}
                        {!assetId && <div>Loading...</div>}
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

export default withRouter(LoanPage)
