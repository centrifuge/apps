import { GetStaticProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import * as React from 'react'
import Auth from '../components/Auth'
import { FunnelHeader } from '../components/FunnelHeader'
import { IpfsPoolsProvider } from '../components/IpfsPoolsProvider'
import { InvestorOnboarding } from '../components/Onboarding'
import { PageContainer } from '../components/PageContainer'
import { TinlakeProvider } from '../components/TinlakeProvider'
import WithFooter from '../components/WithFooter'
import { IpfsPools, loadPoolsFromIPFS } from '../config'

interface Props {
  ipfsPools: IpfsPools
}

const InvestorOnboardingPage: React.FC<Props> = ({ ipfsPools }) => {
  const router = useRouter()
  const { from } = router.query

  return (
    <IpfsPoolsProvider value={ipfsPools}>
      <TinlakeProvider>
        <WithFooter>
          <Head>
            <title>Investor Onboarding | Tinlake | Centrifuge</title>
          </Head>
          <FunnelHeader returnPath={(from as string) || 'https://tinlake.centrifuge.io'} />
          <Auth>
            <PageContainer width="funnel" noMargin>
              <InvestorOnboarding />
            </PageContainer>
          </Auth>
        </WithFooter>
      </TinlakeProvider>
    </IpfsPoolsProvider>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const ipfsPools = await loadPoolsFromIPFS()
  // Fix to force page rerender, from https://github.com/vercel/next.js/issues/9992
  const newProps: Props = { ipfsPools }
  return { props: newProps }
}

export default InvestorOnboardingPage
