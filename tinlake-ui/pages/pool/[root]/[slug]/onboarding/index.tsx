import { GetStaticProps } from 'next'
import { WithRouterProps } from 'next/dist/client/with-router'
import Head from 'next/head'
import * as React from 'react'
import Auth from '../../../../../components/Auth'
import { BackButtonHeader } from '../../../../../components/BackButtonHeader'
import { useDebugFlags } from '../../../../../components/DebugFlags'
import Header from '../../../../../components/Header'
import { IpfsPoolsProvider } from '../../../../../components/IpfsPoolsProvider'
import { PoolOnboarding } from '../../../../../components/Onboarding'
import { PageContainer } from '../../../../../components/PageContainer'
import { TinlakeProvider } from '../../../../../components/TinlakeProvider'
import WithFooter from '../../../../../components/WithFooter'
import { IpfsPools, loadPoolsFromIPFS, Pool } from '../../../../../config'
import OnboardingSteps from '../../../../../containers/Onboarding/OnboardingSteps'
import { menuItems } from '../../../../../menuItems'

interface Props extends WithRouterProps {
  root: string
  pool: Pool
  ipfsPools: IpfsPools
}

const OnboardingPage: React.FC<Props> = ({ pool, ipfsPools }) => {
  const { newOnboarding } = useDebugFlags()
  return (
    <IpfsPoolsProvider value={ipfsPools}>
      <TinlakeProvider addresses={pool.addresses} contractConfig={pool.contractConfig}>
        <WithFooter>
          <Head>
            <title>Investor Onboarding: {pool.metadata.name} | Tinlake | Centrifuge</title>
          </Head>
          {newOnboarding ? (
            <BackButtonHeader />
          ) : (
            <Header
              ipfsPools={ipfsPools}
              poolTitle={pool.metadata.shortName || pool.metadata.name}
              selectedRoute={'/onboarding'}
              menuItems={menuItems}
            />
          )}
          <Auth>
            {newOnboarding ? (
              <PageContainer width="pageNarrow" noMargin>
                <PoolOnboarding activePool={pool} />
              </PageContainer>
            ) : (
              <PageContainer>
                <OnboardingSteps activePool={pool} />
              </PageContainer>
            )}
          </Auth>
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

export default OnboardingPage
