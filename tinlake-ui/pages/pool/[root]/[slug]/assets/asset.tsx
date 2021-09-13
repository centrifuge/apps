import { Box } from 'grommet'
import { GetStaticProps } from 'next'
import { WithRouterProps } from 'next/dist/client/with-router'
import Head from 'next/head'
import { withRouter } from 'next/router'
import * as React from 'react'
import Auth from '../../../../../components/Auth'
import Container from '../../../../../components/Container'
import Header from '../../../../../components/Header'
import { IpfsPoolsProvider } from '../../../../../components/IpfsPoolsProvider'
import PageTitle from '../../../../../components/PageTitle'
import { TinlakeProvider } from '../../../../../components/TinlakeProvider'
import WithFooter from '../../../../../components/WithFooter'
import WithTinlake from '../../../../../components/WithTinlake'
import { IpfsPools, loadPoolsFromIPFS, Pool } from '../../../../../config'
import UnlockNft from '../../../../../containers/Loan/UnlockNft'
import LoanView from '../../../../../containers/Loan/View'
import { menuItems } from '../../../../../menuItems'
import { useAsset } from '../../../../../utils/useAsset'

interface Props extends WithRouterProps {
  root: string
  pool: Pool
  ipfsPools: IpfsPools
}

const LoanPage: React.FC<Props> = ({ pool, ipfsPools, router }) => {
  const { assetId }: { assetId: string } = router.query as any

  const poolId = pool.addresses.ROOT_CONTRACT
  const { data: asset, refetch: refetchAsset } = useAsset(poolId, assetId)

  return (
    <IpfsPoolsProvider value={ipfsPools}>
      <TinlakeProvider addresses={pool.addresses} contractConfig={pool.contractConfig}>
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
                <WithTinlake
                  addresses={pool.addresses}
                  contractConfig={pool.contractConfig}
                  render={(tinlake) => (
                    <Auth
                      render={(auth) => (
                        <>
                          <PageTitle
                            pool={pool}
                            page={`Asset ${assetId}`}
                            parentPage="Assets"
                            parentPageHref="/assets"
                            rightContent={
                              asset && <UnlockNft tinlake={tinlake} auth={auth} asset={asset} refetch={refetchAsset} />
                            }
                          />
                          <Box>
                            {assetId && <LoanView auth={auth} tinlake={tinlake} poolConfig={pool} loanId={assetId} />}
                            {!assetId && <div>Loading...</div>}
                          </Box>
                        </>
                      )}
                    />
                  )}
                />
              </Box>
            </Box>
          </Container>
        </WithFooter>
      </TinlakeProvider>
    </IpfsPoolsProvider>
  )
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
