import { AnchorButton, Box, Button, Shelf } from '@centrifuge/fabric'
import * as React from 'react'
import { useHistory } from 'react-router-dom'
import { Content, ContentHeader } from '../../components/Onboarding'
import { OnboardingPool, useOnboarding } from '../../components/OnboardingProvider'
import { OnboardingUser } from '../../types'

type Props = {
  signedAgreementUrl: string | undefined
}

export const ApprovalStatus = ({ signedAgreementUrl }: Props) => {
  const history = useHistory()
  const { onboardingUser, refetchOnboardingUser, pool } = useOnboarding<
    NonNullable<OnboardingUser>,
    NonNullable<OnboardingPool>
  >()

  const poolId = pool.id
  const trancheId = pool.trancheId
  const poolName = pool.name

  const onboardingStatus = onboardingUser?.poolSteps?.[poolId]?.[trancheId]?.status?.status

  const onFocus = () => {
    refetchOnboardingUser()
  }

  React.useEffect(() => {
    if (
      onboardingUser.poolSteps?.[poolId]?.[trancheId]?.status?.status === 'pending' ||
      (onboardingUser.investorType === 'entity' && onboardingUser?.manualKybStatus)
    ) {
      window.addEventListener('focus', onFocus)
    } else {
      window.removeEventListener('focus', onFocus)
    }

    return () => {
      window.removeEventListener('focus', onFocus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingUser, pool])

  if (onboardingStatus === 'approved') {
    return (
      <Content>
        <ContentHeader
          title="Onboarding complete!"
          body={<>You have succesfully completed the onboarding for {poolName}</>}
        />
        <Shelf gap="2">
          <AnchorButton variant="secondary" href={signedAgreementUrl} target="__blank">
            View subscription agreement
          </AnchorButton>
          <Button onClick={() => history.push(`/pools/${poolId}`)}>Invest</Button>
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
    if (
      onboardingUser.investorType === 'entity' &&
      onboardingUser.manualKybStatus === 'review.pending' &&
      !onboardingUser.globalSteps.verifyBusiness.completed
    ) {
      return (
        <Content>
          <ContentHeader
            title="Onboarding almost complete!"
            body="Your documents are under review. You will be notified you once your profile is approved."
          />

          <Box>
            <AnchorButton variant="secondary" href={signedAgreementUrl} target="__blank">
              View subscription agreement
            </AnchorButton>
          </Box>
        </Content>
      )
    }

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
