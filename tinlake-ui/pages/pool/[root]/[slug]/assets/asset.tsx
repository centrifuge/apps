import { Box } from 'grommet'
import { GetStaticProps } from 'next'
import { WithRouterProps } from 'next/dist/client/with-router'
import Head from 'next/head'
import { withRouter } from 'next/router'
import * as React from 'react'
import Auth from '../../../../../components/Auth'
import Container from '../../../../../components/Container'
import Header from '../../../../../components/Header'
import PoolTitle from '../../../../../components/PoolTitle'
import WithFooter from '../../../../../components/WithFooter'
import WithTinlake from '../../../../../components/WithTinlake'
import { IpfsPools, loadPoolsFromIPFS, Pool } from '../../../../../config'
import LoanView from '../../../../../containers/Loan/View'
import { menuItems } from '../../../../../menuItems'

interface Props extends WithRouterProps {
  root: string
  pool: Pool
  ipfsPools: IpfsPools
}

class LoanPage extends React.Component<Props> {
  render() {
    const { pool, ipfsPools } = this.props
    const { assetId }: { assetId: string } = this.props.router.query as any

    return (
      <WithFooter>
        <Head>
          <title>
            Asset {assetId}: {pool.metadata.name} | Tinlake | Centrifuge | Decentralized Asset Financing
          </title>
        </Head>
        <Header
          ipfsPools={ipfsPools}
          poolTitle={pool.metadata.shortName || pool.metadata.name}
          selectedRoute={'/assets/asset'}
          menuItems={menuItems}
        />
        <Container>
          <Box justify="center" direction="row">
            <Box width="xlarge" margin={{ top: 'medium' }}>
              <PoolTitle
                pool={pool}
                page={`Asset ${assetId}`}
                parentPage="Assets"
                parentPageHref="/assets"
                // rightContent={
                //   <Box gap="small" justify="end" direction="row" margin={{ top: 'medium' }}>
                //     <Button secondary size="small" label="Previous" />
                //     <ChevronRight />
                //   </Box>
                // }
              />

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
  const pools = await loadPoolsFromIPFS()
  const paths = pools.active.map((pool) => ({
    params: { root: pool.addresses.ROOT_CONTRACT, slug: pool.metadata.slug },
  }))

  // { fallback: false } means other routes should 404.
  return { paths, fallback: false }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const pools = await loadPoolsFromIPFS()
  return {
    props: {
      root: params?.root,
      pool: pools.active.find((p) => p.addresses.ROOT_CONTRACT === params?.root),
      ipfsPools: pools,
    },
  }
}

export default withRouter(LoanPage)
