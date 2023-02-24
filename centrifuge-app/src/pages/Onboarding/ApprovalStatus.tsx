import { AnchorButton, Box, Button, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useHistory } from 'react-router-dom'
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
      <Stack gap={4}>
        <Box>
          <Text fontSize={5}>Onboarding complete!</Text>
          <Text>You have succesfully completed the onboarding for {pool.title}</Text>
        </Box>
        <Shelf gap="2">
          <AnchorButton variant="secondary" href={signedAgreementUrl} target="__blank">
            View subscription agreement
          </AnchorButton>
          <Button onClick={() => history.push(`/investments/${pool.id}`)}>Invest</Button>
        </Shelf>
      </Stack>
    )
  }

  if (onboardingStatus === 'rejected') {
    return (
      <Stack gap={4}>
        <Box>
          <Text fontSize={5}>Something went wrong with your onboarding profile.</Text>
          <Text>
            Please contact <a href="mailto:support@centrifuge.io">support@centrifuge.io</a> for more information
          </Text>
        </Box>
        <Box>
          <AnchorButton variant="secondary" href={signedAgreementUrl} target="__blank">
            View subscription agreement
          </AnchorButton>
        </Box>
      </Stack>
    )
  }

  if (onboardingStatus === 'pending') {
    return (
      <Stack gap={4}>
        <Box>
          <Text fontSize={5}>Onboarding almost complete!</Text>
          <Text>Your documents and profile have been sent to the issuer for approval.</Text>
        </Box>
        <Box>
          <AnchorButton variant="secondary" href={signedAgreementUrl} target="__blank">
            View subscription agreement
          </AnchorButton>
        </Box>
      </Stack>
    )
  }

  return null
}
