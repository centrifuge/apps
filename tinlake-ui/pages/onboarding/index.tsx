import { InvestorOnboarding } from '@centrifuge/onboarding-ui'
import { GetStaticProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Auth from '../../components/Auth'
import { FunnelHeader } from '../../components/FunnelHeader'
import { IpfsPoolsProvider } from '../../components/IpfsPoolsProvider'
import { TinlakeProvider } from '../../components/TinlakeProvider'
import WithFooter from '../../components/WithFooter'
import { IpfsPools, loadPoolsFromIPFS } from '../../config'
import { AuthState, ensureAuthed } from '../../ducks/auth'
import { useAddress } from '../../utils/useAddress'
import { useInvestorOnboardingState } from '../../utils/useOnboardingState'

interface Props {
  ipfsPools: IpfsPools
}

const InvestorOnboardingPage: React.FC<Props> = ({ ipfsPools }) => {
  const router = useRouter()
  const { from } = router.query

  const address = useAddress()
  const onboarding = useInvestorOnboardingState()

  const { authState } = useSelector<any, AuthState>((state) => state.auth)

  const dispatch = useDispatch()

  function connect() {
    dispatch(ensureAuthed())
  }

  return (
    <IpfsPoolsProvider value={ipfsPools}>
      <TinlakeProvider>
        <WithFooter>
          <Head>
            <title>Investor Onboarding | Tinlake | Centrifuge</title>
          </Head>
          <FunnelHeader returnPath={(from as string) || '/'} />
          <Auth>
            <InvestorOnboarding authState={authState} address={address} onboarding={onboarding} connect={connect} />
          </Auth>
        </WithFooter>
      </TinlakeProvider>
    </IpfsPoolsProvider>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const ipfsPools = await loadPoolsFromIPFS()

  return {
    props: {
      ipfsPools,
    },
  }
}

export default InvestorOnboardingPage
