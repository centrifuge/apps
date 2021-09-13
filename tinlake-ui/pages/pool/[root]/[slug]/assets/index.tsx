import { Button } from 'grommet'
import { GetStaticProps } from 'next'
import { WithRouterProps } from 'next/dist/client/with-router'
import Head from 'next/head'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useSelector } from 'react-redux'
import Auth from '../../../../../components/Auth'
import Header from '../../../../../components/Header'
import { SectionHeading } from '../../../../../components/Heading'
import { IpfsPoolsProvider } from '../../../../../components/IpfsPoolsProvider'
import { Box, Stack } from '../../../../../components/Layout'
import { PageContainer } from '../../../../../components/PageContainer'
import PageTitle from '../../../../../components/PageTitle'
import { PoolLink } from '../../../../../components/PoolLink'
import { TinlakeProvider } from '../../../../../components/TinlakeProvider'
import WithFooter from '../../../../../components/WithFooter'
import WithTinlake from '../../../../../components/WithTinlake'
import { IpfsPools, loadPoolsFromIPFS, Pool } from '../../../../../config'
import LoanList from '../../../../../containers/Loan/List'
import LoanOverview from '../../../../../containers/Loan/Overview/index'
import { AuthState } from '../../../../../ducks/auth'
import { menuItems } from '../../../../../menuItems'
import { usePool } from '../../../../../utils/usePool'

interface Props extends WithRouterProps {
  root: string
  pool: Pool
  ipfsPools: IpfsPools
}

const LoanListPage: React.FC<Props> = (props) => {
  const { pool, ipfsPools } = props

  const { data: poolData } = usePool(pool.addresses.ROOT_CONTRACT)
  const auth = useSelector<any, AuthState>((state) => state.auth)
  const router = useRouter()
  const isBorrower = poolData?.isPoolAdmin || (auth?.proxies && auth?.proxies.length > 0) || 'lockNFT' in router.query

  return (
    <IpfsPoolsProvider value={ipfsPools}>
      <TinlakeProvider addresses={pool.addresses} contractConfig={pool.contractConfig}>
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
          <PageContainer>
            <WithTinlake
              addresses={pool.addresses}
              contractConfig={pool.contractConfig}
              render={(tinlake) => (
                <Auth
                  tinlake={tinlake}
                  render={(auth) => (
                    <>
                      <PageTitle
                        pool={props.pool}
                        page="Assets"
                        rightContent={
                          isBorrower && (
                            <Box display={['none', 'block']}>
                              <PoolLink href={'/assets/issue'}>
                                <Button primary label="Lock NFT" />
                              </PoolLink>
                            </Box>
                          )
                        }
                      />
                      <Stack gap="xlarge">
                        <LoanOverview tinlake={tinlake} auth={auth} selectedPool={props.pool} />
                        <Stack gap="small">
                          <SectionHeading>Asset List</SectionHeading>
                          <LoanList tinlake={tinlake} auth={auth} activePool={props.pool} />
                        </Stack>
                      </Stack>
                    </>
                  )}
                />
              )}
            />
          </PageContainer>
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

export default LoanListPage
