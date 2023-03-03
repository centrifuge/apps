import { AnchorButton, Box, Button, Shelf } from '@centrifuge/fabric'
import * as React from 'react'
import { useHistory } from 'react-router-dom'
import { Content, ContentHeader } from '../../components/Onboarding'
import { useOnboarding } from '../../components/OnboardingProvider'

type Props = {
  signedAgreementUrl: string | undefined
}

export const ApprovalStatus = ({ signedAgreementUrl }: Props) => {
  const history = useHistory()
  const { onboardingUser, refetchOnboardingUser, pool } = useOnboarding()

  const onboardingStatus = onboardingUser?.poolSteps?.[pool.id]?.[pool.trancheId].status.status

  const onFocus = () => {
    refetchOnboardingUser()
  }

  React.useEffect(() => {
    if (onboardingUser?.poolSteps[pool.id]?.[pool.trancheId]?.status.status === 'pending') {
      window.addEventListener('focus', onFocus)
    } else {
      window.removeEventListener('focus', onFocus)
    }

    return () => {
      window.removeEventListener('focus', onFocus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingUser?.poolSteps[pool.id]?.[pool.trancheId]?.status.status])

  if (onboardingStatus === 'approved') {
    return (
      <Content>
        <ContentHeader
          title="Onboarding complete!"
          body={<>You have succesfully completed the onboarding for {pool.title}</>}
        />

        <Shelf gap="2">
          <AnchorButton variant="secondary" href={signedAgreementUrl} target="__blank">
            View subscription agreement
          </AnchorButton>
          <Button onClick={() => history.push(`/investments/${pool.id}`)}>Invest</Button>
        </Shelf>
      </Content>
    )
  }

  if (onboardingStatus === 'rejected') {
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

        <Box>
          <AnchorButton variant="secondary" href={signedAgreementUrl} target="__blank">
            View subscription agreement
          </AnchorButton>
        </Box>
      </Content>
    )
  }

  if (onboardingStatus === 'pending') {
    return (
      <Content>
        <ContentHeader
          title="Onboarding almost complete!"
          body="Your documents and profile have been sent to the issuer for approval."
        />

        <Box>
          <AnchorButton variant="secondary" href={signedAgreementUrl} target="__blank">
            View subscription agreement
          </AnchorButton>
        </Box>
      </Content>
    )
  }

  return null
}
