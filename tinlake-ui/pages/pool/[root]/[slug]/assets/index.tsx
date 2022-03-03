import { Button } from 'grommet'
import { GetStaticProps } from 'next'
import { WithRouterProps } from 'next/dist/client/with-router'
import Head from 'next/head'
import * as React from 'react'
import Auth from '../../../../../components/Auth'
import { useDebugFlags } from '../../../../../components/DebugFlags'
import Header from '../../../../../components/Header'
import { SectionHeading } from '../../../../../components/Heading'
import { IpfsPoolsProvider } from '../../../../../components/IpfsPoolsProvider'
import { Box, Stack } from '../../../../../components/Layout'
import { PageContainer } from '../../../../../components/PageContainer'
import PageTitle from '../../../../../components/PageTitle'
import { PoolLink } from '../../../../../components/PoolLink'
import Scorecard from '../../../../../components/Scorecard'
import { TinlakeProvider } from '../../../../../components/TinlakeProvider'
import WithFooter from '../../../../../components/WithFooter'
import { IpfsPools, loadPoolsFromIPFS, Pool } from '../../../../../config'
import LoanList from '../../../../../containers/Loan/List'
import LoanOverview from '../../../../../containers/Loan/Overview/index'
import { useAuth } from '../../../../../ducks/auth'
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
  const auth = useAuth()
  const { showLockNFT } = useDebugFlags()
  const isBorrower = poolData?.isPoolAdmin || (auth?.proxies && auth?.proxies.length > 0) || showLockNFT

  return (
    <IpfsPoolsProvider value={ipfsPools}>
      <TinlakeProvider addresses={pool.addresses} contractConfig={pool.contractConfig} contractVersions={pool.versions}>
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
            <Auth>
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
              <Stack gap="medium">
                <LoanOverview auth={auth} selectedPool={props.pool} />
                <Stack gap="small">
                  <Scorecard activePool={props.pool} />
                  <Box mt="16px">
                    <SectionHeading>Asset List</SectionHeading>
                  </Box>
                  <LoanList auth={auth} activePool={props.pool} />
                </Stack>
              </Stack>
            </Auth>
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
