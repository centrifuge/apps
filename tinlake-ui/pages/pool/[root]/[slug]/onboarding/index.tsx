import { PoolOnboarding } from '@centrifuge/onboarding-ui'
import { GetStaticProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Auth from '../../../../../components/Auth'
import { FunnelHeader } from '../../../../../components/FunnelHeader'
import { IpfsPoolsProvider } from '../../../../../components/IpfsPoolsProvider'
import { TinlakeProvider } from '../../../../../components/TinlakeProvider'
import WithFooter from '../../../../../components/WithFooter'
import { IpfsPools, loadPoolsFromIPFS, Pool } from '../../../../../config'
import { AuthState, ensureAuthed } from '../../../../../ducks/auth'
import { useAddress } from '../../../../../utils/useAddress'
import { useOnboardingState } from '../../../../../utils/useOnboardingState'

interface Props {
  root: string
  pool: Pool
  ipfsPools: IpfsPools
}

type Tranche = 'junior' | 'senior'

const DefaultTranche = 'senior'

const OnboardingPage: React.FC<Props> = ({ pool, ipfsPools }) => {
  const router = useRouter()
  const { root, slug, from } = router.query

  const trancheOverride = router.query.tranche as Tranche | undefined
  const tranche = trancheOverride || DefaultTranche

  const address = useAddress()
  const onboarding = useOnboardingState(pool, tranche)
  const { authState } = useSelector<any, AuthState>((state) => state.auth)

  const dispatch = useDispatch()

  function connect() {
    dispatch(ensureAuthed())
  }

  return (
    <IpfsPoolsProvider value={ipfsPools}>
      <TinlakeProvider addresses={pool.addresses} contractConfig={pool.contractConfig} contractVersions={pool.versions}>
        <WithFooter>
          <Head>
            <title>Investor Onboarding: {pool.metadata.name} | Tinlake | Centrifuge</title>
          </Head>
          <FunnelHeader returnPath={(from as string) || `/pool/${root}/${slug}/investments`} />
          <Auth>
            <PoolOnboarding
              authState={authState}
              address={address}
              pool={pool}
              onboarding={onboarding}
              connect={connect}
            />
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
