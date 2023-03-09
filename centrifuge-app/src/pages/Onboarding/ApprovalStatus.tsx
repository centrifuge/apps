import { AnchorButton, Box, Button, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useHistory } from 'react-router-dom'
import { OnboardingPool, useOnboarding } from '../../components/OnboardingProvider'
import { OnboardingUser } from '../../types'

type Props = {
  signedAgreementUrl: string | undefined
}

export const ApprovalStatus = ({ signedAgreementUrl }: Props) => {
  const history = useHistory()
  const { onboardingUser, refetchOnboardingUser, pool } = useOnboarding<OnboardingUser, NonNullable<OnboardingPool>>()

  const poolId = pool.id
  const trancheId = pool.trancheId
  const poolName = pool.name

  const onboardingStatus = onboardingUser?.poolSteps[poolId][trancheId].status.status

  const onFocus = () => {
    refetchOnboardingUser()
  }

  React.useEffect(() => {
    if (onboardingUser?.poolSteps[poolId][trancheId].status.status === 'pending') {
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
      <Stack gap={4}>
        <Box>
          <Text fontSize={5}>Onboarding complete!</Text>
          <Text>You have succesfully completed the onboarding for {poolName}</Text>
        </Box>
        <Shelf gap="2">
          <AnchorButton variant="secondary" href={signedAgreementUrl} target="__blank">
            View subscription agreement
          </AnchorButton>
          <Button onClick={() => history.push(`/investments/${poolId}`)}>Invest</Button>
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
