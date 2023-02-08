import { useWallet } from '@centrifuge/centrifuge-react'
import { AnchorButton, Box, Button, Flex, Shelf, Stack, Text } from '@centrifuge/fabric'
import { useQuery } from 'react-query'
import { useHistory } from 'react-router-dom'
import { useAuth } from '../../components/AuthProvider'
import { useOnboardingUser } from '../../components/OnboardingUserProvider'
import { Spinner } from '../../components/Spinner'

type Props = {
  signedAgreementUrl: string | undefined
}

// TODO: use real pool title
const examplePool = {
  title: 'New Silver Junior Token',
}

// TODO: make dynamic based on the pool and tranche that the user is onboarding to
const trancheId = 'FAKETRANCHEID'
const poolId = 'FAKEPOOLID'

export const ApprovalStatus = ({ signedAgreementUrl }: Props) => {
  const history = useHistory()
  const { onboardingUser, refetchOnboardingUser } = useOnboardingUser()
  const { selectedAccount } = useWallet()
  const { authToken } = useAuth()

  const onboardingStatus = onboardingUser?.onboardingStatus?.[poolId]?.[trancheId].status

  const { isFetching } = useQuery(
    ['onboardingStatus', selectedAccount?.address, poolId, trancheId],
    async () => {
      const response = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/sendDocumentsToIssuer`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trancheId,
          poolId,
        }),
        credentials: 'include',
      })

      if (response.status === 201) {
        return response
      }
      throw response.statusText
    },
    {
      enabled: onboardingStatus === null,
      onSuccess: () => {
        refetchOnboardingUser()
      },
    }
  )

  if (isFetching) {
    return (
      <Flex height="520px" justifyContent="center">
        <Spinner />
      </Flex>
    )
  }

  if (onboardingStatus === 'approved') {
    return (
      <Stack gap={4}>
        <Box>
          <Text fontSize={5}>Onboarding complete!</Text>
          <Text>You have succesfully completed the onboarding for {examplePool.title}</Text>
        </Box>
        <Shelf gap="2">
          <AnchorButton variant="secondary" href={signedAgreementUrl} target="__blank">
            View subscription agreement
          </AnchorButton>
          <Button onClick={() => history.push('/')}>Invest</Button>
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
