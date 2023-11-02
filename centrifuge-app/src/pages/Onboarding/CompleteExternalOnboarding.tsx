import { Button } from '@centrifuge/fabric'
import * as React from 'react'
import { ActionBar, Container, Content, ContentHeader, Header, Layout, PoolBranding } from '../../components/Onboarding'
import { useOnboarding } from '../../components/OnboardingProvider'

type Props = {
  openNewTab: () => void
  poolId: string | null
  poolSymbol?: string
}

export const CompleteExternalOnboarding = ({ openNewTab, poolId, poolSymbol }: Props) => {
  const { refetchOnboardingUser, isExternal } = useOnboarding()

  const onFocus = () => {
    refetchOnboardingUser()
  }

  React.useEffect(() => {
    window.addEventListener('focus', onFocus)

    return () => {
      window.removeEventListener('focus', onFocus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Layout>
      <Header walletMenu={!isExternal}>{!!poolId && <PoolBranding poolId={poolId} symbol={poolSymbol} />}</Header>

      <Container>
        <>
          <Content>
            <ContentHeader
              title="Complete your onboarding in new tab"
              body={'Once you are done, return back to this page.'}
            />
          </Content>
          <ActionBar>
            <Button onClick={openNewTab}>Open in new tab</Button>
          </ActionBar>
        </>
      </Container>
    </Layout>
  )
}
