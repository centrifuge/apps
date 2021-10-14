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
  market: 'aave'
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
          <title>Investor Onboarding for {capitalizeFirstLetter(props.market)} | Tinlake | Centrifuge</title>
        </Head>
        <FunnelHeader returnPath={config.aaveOnboardingReturnUrl} />
        <Auth>
          <PageContainer width="funnel" noMargin>
            <PoolOnboarding
              market="aave"
              activePool={{
                network: 'mainnet',
                version: 3,
                isUpcoming: false,
                addresses: {
                  ROOT_CONTRACT: props.market,
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
                metadata: { name: 'Aave', slug: 'aave', asset: '-' },
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
  const paths = [{ params: { market: 'aave' } }]

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

const capitalizeFirstLetter = (text: string) => {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
