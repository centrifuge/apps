import { Box, Button, Checkbox, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useMutation, useQuery } from 'react-query'
import { useAuth } from '../../components/AuthProvider'
import { useOnboardingUser } from '../../components/OnboardingUserProvider'
import { PDFViewer } from '../../components/PDFViewer'

type Props = {
  nextStep: () => void
  backStep: () => void
}

// TODO: make dynamic based on the pool and tranche that the user is onboarding to
const trancheId = 'FAKETRANCHEID'
const poolId = 'FAKEPOOLID'

export const SignSubscriptionAgreement = ({ nextStep, backStep }: Props) => {
  const [isAgreed, setIsAgreed] = React.useState(false)
  const { authToken } = useAuth()
  const { refetchOnboardingUser } = useOnboardingUser()

  const { data } = useQuery(
    'unsignedSubscriptionAgreement',
    async () => {
      const response = await fetch(
        `${import.meta.env.REACT_APP_ONBOARDING_API_URL}/getUnsignedAgreement?poolId=${poolId}&trancheId=${trancheId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      )

      const json = await response.json()

      const documentBlob = new Blob([Uint8Array.from(json.unsignedAgreement.data).buffer], {
        type: 'application/pdf',
      })

      return URL.createObjectURL(documentBlob)
    },
    {
      refetchOnWindowFocus: false,
    }
  )

  const { mutate: signForm, isLoading } = useMutation(
    async () => {
      const response = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/signAgreement`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          poolId,
          trancheId,
        }),
        credentials: 'include',
      })
      return response.json()
    },
    {
      onSuccess: () => {
        refetchOnboardingUser()
        nextStep()
      },
    }
  )

  return (
    <Stack gap={4}>
      <Box>
        <Text fontSize={5}>Sign subscription agreement</Text>
        <Text fontSize={2}>Complete subscription agreement</Text>
        {data && (
          <Box overflowY="scroll" height="500px">
            <PDFViewer file={data} />
          </Box>
        )}
      </Box>
      <Checkbox
        style={{
          cursor: 'pointer',
        }}
        checked={isAgreed}
        onChange={() => setIsAgreed((current) => !current)}
        label={<Text style={{ cursor: 'pointer' }}>I agree to the agreement</Text>}
        disabled={isLoading}
      />
      <Shelf gap="2">
        <Button onClick={() => backStep()} variant="secondary" disabled={isLoading}>
          Back
        </Button>
        <Button
          onClick={() => signForm()}
          loadingMessage="Signing"
          loading={isLoading}
          disabled={!isAgreed || isLoading}
        >
          Sign
        </Button>
      </Shelf>
    </Stack>
  )
}
