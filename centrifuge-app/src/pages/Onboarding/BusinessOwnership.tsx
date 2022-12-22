import { Box, Button, InlineFeedback, Stack, Text, TextInput } from '@centrifuge/fabric'
import { useMutation } from 'react-query'
import { useAuth } from '../../components/AuthProvider'
import { ultimateBeneficialOwner } from '../../types'
import { StyledInlineFeedback } from './StyledInlineFeedback'

type Props = {
  nextStep: () => void
  ultimateBeneficialOwners: ultimateBeneficialOwner[]
}

const BusinessOwnershipInlineFeedback = ({ isError, isSuccess }: { isError: boolean; isSuccess: boolean }) => {
  if (isError) {
    return (
      <StyledInlineFeedback>
        <InlineFeedback status="warning">
          <Text fontSize="14px">
            Unable to confirm business ownership or business ownership has already been confirmed. Please try again or
            contact support@centrifuge.io.
          </Text>
        </InlineFeedback>
      </StyledInlineFeedback>
    )
  }

  if (isSuccess) {
    return (
      <StyledInlineFeedback>
        <InlineFeedback status="ok">
          <Text fontSize="14px">Business ownership confirmed.</Text>
        </InlineFeedback>
      </StyledInlineFeedback>
    )
  }

  return null
}

export const BusinessOwnership = ({ nextStep, ultimateBeneficialOwners }: Props) => {
  const { authToken } = useAuth()

  const {
    mutate: verifyBusinessOwnership,
    isLoading,
    isSuccess,
    isError,
  } = useMutation(async () => {
    const response = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API}/businessVerificationConfirm`, {
      method: 'POST',
      body: JSON.stringify({
        ultimateBeneficialOwners,
      }),
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (response.status !== 201) {
      throw new Error()
    }
  })

  return (
    <Stack gap={4}>
      <Box>
        <BusinessOwnershipInlineFeedback isError={isError} isSuccess={isSuccess} />
        <Text fontSize={5}>Confirm business ownership</Text>
        <Stack gap={2} py={6} width="493px">
          {ultimateBeneficialOwners.map((owner, index) => {
            return <TextInput key={index} value={owner.name} disabled label="Name*" />
          })}
        </Stack>
      </Box>
      <Box>
        {isSuccess ? (
          <Button variant="primary" onClick={nextStep}>
            Next
          </Button>
        ) : (
          <Button
            onClick={() => verifyBusinessOwnership()}
            loading={isLoading}
            disabled={isLoading}
            loadingMessage="Confirming"
          >
            Confirm
          </Button>
        )}
      </Box>
    </Stack>
  )
}
