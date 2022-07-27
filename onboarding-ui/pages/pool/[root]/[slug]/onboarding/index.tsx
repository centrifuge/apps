import { GetStaticProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import * as React from 'react'
import Auth from '../../../../../components/Auth'
import { FunnelHeader } from '../../../../../components/FunnelHeader'
import { IpfsPoolsProvider } from '../../../../../components/IpfsPoolsProvider'
import { PoolOnboarding } from '../../../../../components/Onboarding'
import { PageContainer } from '../../../../../components/PageContainer'
import { TinlakeProvider } from '../../../../../components/TinlakeProvider'
import WithFooter from '../../../../../components/WithFooter'
import { IpfsPools, loadPoolsFromIPFS, Pool } from '../../../../../config'

interface Props {
  root: string
  pool: Pool
  ipfsPools: IpfsPools
}

const OnboardingPage: React.FC<Props> = ({ pool, ipfsPools }) => {
  const router = useRouter()
  const { root, slug, from } = router.query
  return (
    <IpfsPoolsProvider value={ipfsPools}>
      <TinlakeProvider addresses={pool.addresses} contractConfig={pool.contractConfig} contractVersions={pool.versions}>
        <WithFooter>
          <Head>
            <title>Investor Onboarding: {pool.metadata.name} | Tinlake | Centrifuge</title>
          </Head>
          <FunnelHeader returnPath={(from as string) || `/pool/${root}/${slug}/investments`} />
          <Auth>
            <PageContainer width="funnel" noMargin>
              <PoolOnboarding activePool={pool} />
            </PageContainer>
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
