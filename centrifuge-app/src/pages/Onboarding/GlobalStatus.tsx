import { Button } from '@centrifuge/fabric'
import React from 'react'
import { useHistory } from 'react-router-dom'
import { ActionBar, Content, ContentHeader } from '../../components/Onboarding'
import { useOnboarding } from '../../components/OnboardingProvider'

export const GlobalStatus = () => {
  const history = useHistory()
  const { onboardingUser, refetchOnboardingUser, isExternal } = useOnboarding()

  const onFocus = () => {
    refetchOnboardingUser()
  }

  React.useEffect(() => {
    if (onboardingUser.investorType === 'entity' && onboardingUser?.manualKybStatus === 'review.pending') {
      window.addEventListener('focus', onFocus)
    } else {
      window.removeEventListener('focus', onFocus)
    }

    return () => {
      window.removeEventListener('focus', onFocus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingUser])

  if (onboardingUser.investorType === 'entity' && onboardingUser?.manualKybStatus === 'review.pending') {
    return (
      <Content>
        <ContentHeader
          title="Onboarding almost complete!"
          body="Your documents are under review. You will be notified you once your profile is approved."
        />
      </Content>
    )
  }

  if (onboardingUser.investorType === 'entity' && onboardingUser?.manualKybStatus === 'verification.declined') {
    return (
      <Content>
        <ContentHeader
          title="Something went wrong with your onboarding profile."
          body={
            <>
              Please contact <a href="mailto:support@centrifuge.io">support@centrifuge.io</a> for more information
            </>
          }
        />
      </Content>
    )
  }

  return (
    <>
      <Content>
        <ContentHeader
          title="Thanks for verifying your identity"
          body={
            isExternal
              ? 'Please close this tab and return back to the Safe app.'
              : 'Please click the button below to access the pools available for investment.'
          }
        />
      </Content>

      {!isExternal && (
        <ActionBar>
          <Button
            onClick={() => {
              history.push('/pools')
            }}
          >
            View Pools
          </Button>
        </ActionBar>
      )}
    </>
  )
}
