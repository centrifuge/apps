import { Box, Heading } from 'grommet'
import { GetStaticProps } from 'next'
import withRouter, { WithRouterProps } from 'next/dist/client/with-router'
import Head from 'next/head'
import * as React from 'react'
import Auth from '../../../../../components/Auth'
import { BackLink } from '../../../../../components/BackLink'
import Container from '../../../../../components/Container'
import Header from '../../../../../components/Header'
import SecondaryHeader from '../../../../../components/SecondaryHeader'
import WithFooter from '../../../../../components/WithFooter'
import WithTinlake from '../../../../../components/WithTinlake'
import { IpfsPools, loadPoolsFromIPFS, Pool } from '../../../../../config'
import IssueLoan from '../../../../../containers/Loan/Issue'
import { menuItems } from '../../../../../menuItems'

interface Props extends WithRouterProps {
  root: string
  pool: Pool
  ipfsPools: IpfsPools
}

class LoanIssuePage extends React.Component<Props> {
  render() {
    const { pool, ipfsPools } = this.props
    const { tokenId, registry }: { tokenId: string; registry: string } = this.props.router.query as any

    return (
      <WithFooter>
        <Head>
          <title>Lock NFT: {pool.metadata.name} | Tinlake | Centrifuge</title>
        </Head>
        <Header
          ipfsPools={ipfsPools}
          poolTitle={pool.metadata.shortName || pool.metadata.name}
          selectedRoute={'/assets/issue'}
          menuItems={menuItems}
        />
        <Container>
          <Box justify="center" direction="row">
            <Box width="xlarge">
              <WithTinlake
                addresses={pool.addresses}
                contractConfig={pool.contractConfig}
                render={(tinlake) => (
                  <Auth
                    tinlake={tinlake}
                    render={(auth) => (
                      <Box>
                        <SecondaryHeader>
                          <Box direction="row" gap="small" align="center" margin={{ top: 'medium' }}>
                            <BackLink href={'/assets'} />
                            <Heading level="4">Lock NFT</Heading>
                          </Box>
                        </SecondaryHeader>
                        <IssueLoan
                          tinlake={tinlake}
                          poolConfig={pool}
                          auth={auth}
                          tokenId={tokenId}
                          registry={registry}
                        />
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
  return { props: { ipfsPools: pools, root: params?.root, pool: pools.active.find((p) => p.addresses.ROOT_CONTRACT === params?.root) } }
}

export default withRouter(LoanIssuePage)
