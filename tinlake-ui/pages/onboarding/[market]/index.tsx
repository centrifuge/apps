import { GetStaticProps } from 'next'
import { WithRouterProps } from 'next/dist/client/with-router'
import Head from 'next/head'
import * as React from 'react'
import Auth from '../../../components/Auth'
import { FunnelHeader } from '../../../components/FunnelHeader'
import { PoolOnboarding } from '../../../components/Onboarding'
import { PageContainer } from '../../../components/PageContainer'
import { TinlakeProvider } from '../../../components/TinlakeProvider'
import WithFooter from '../../../components/WithFooter'
import config, { loadPoolsFromIPFS, Pool } from '../../../config'

interface Props extends WithRouterProps {
  market: 'rwa-market'
  pool: Pool
}

const OnboardingPage: React.FC<Props> = (props: Props) => {
  return (
    <TinlakeProvider
      addresses={props.pool.addresses}
      contractConfig={props.pool.contractConfig}
      contractVersions={props.pool.versions}
    >
      <WithFooter hideHelpMenu={true}>
        <Head>
          <title>Investor Onboarding for the RWA Market | Tinlake | Centrifuge</title>
        </Head>
        <FunnelHeader returnPath={config.rwaMarketOnboardingReturnUrl} />
        <Auth>
          <PageContainer width="funnel" noMargin>
            <PoolOnboarding
              market="rwa-market"
              activePool={{
                network: 'mainnet',
                version: 3,
                isUpcoming: false,
                isLaunching: false,
                addresses: {
                  ROOT_CONTRACT: props.market,
                  TINLAKE_CURRENCY: '0x0',
                  ACTIONS: '0x0',
                  PROXY_REGISTRY: '0x0',
                  COLLATERAL_NFT: '0x0',
                  SENIOR_TOKEN: '0x0',
                  JUNIOR_TOKEN: '0x0',
                  CLERK: '0x0',
                  ASSESSOR: '0x0',
                  RESERVE: '0x0',
                  SENIOR_TRANCHE: '0x0',
                  JUNIOR_TRANCHE: '0x0',
                  FEED: '0x0',
                  POOL_ADMIN: '0x0',
                  SENIOR_MEMBERLIST: '0x0',
                  JUNIOR_MEMBERLIST: '0x0',
                  COORDINATOR: '0x0',
                  PILE: '0x0',
                },
                metadata: { name: 'the RWA Market', slug: 'rwa-market', asset: '-', currencySymbol: 'USDC' },
              }}
            />
          </PageContainer>
        </Auth>
      </WithFooter>
    </TinlakeProvider>
  )
}

export async function getStaticPaths() {
  // We'll pre-render only these paths at build time.
  const paths = [{ params: { market: 'rwa-market' } }]

  // { fallback: false } means other routes should 404.
  return { paths, fallback: false }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const pools = await loadPoolsFromIPFS()

  return {
    props: {
      market: params?.market,
      pool: pools.active[0], // just choose a random pool, so we can initialize tinlake.js
    },
  }
}

export default OnboardingPage
