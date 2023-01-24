import { Box, Button, FileUpload, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useMutation } from 'react-query'
import { useAuth } from '../../components/AuthProvider'
import { useOnboardingUser } from '../../components/OnboardingUserProvider'

type Props = {
  nextStep: () => void
  backStep: () => void
}

// TODO: make dynamic based on the pool and tranche that the user is onboarding to
const trancheId = 'FAKETRANCHEID'
const poolId = 'FAKEPOOLID'

export const TaxInfo = ({ backStep, nextStep }: Props) => {
  const { refetchOnboardingUser, onboardingUser } = useOnboardingUser()
  const [taxInfo, setTaxInfo] = React.useState<File | null>(null)
  const { authToken } = useAuth()

  const isCompleted = !!onboardingUser?.steps?.verifyTaxInfo?.completed

  const { mutate: uploadTaxInfo, isLoading } = useMutation(
    async () => {
      const formData = new FormData()
      formData.append('taxInfo', taxInfo as File, 'taxInfo.pdf')

      const response = await fetch(
        `${import.meta.env.REACT_APP_ONBOARDING_API_URL}/uploadTaxInfo?poolId=${poolId}&trancheId=${trancheId}`,
        {
          method: 'POST',
          body: formData,
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'multipart/form-data',
          },
          credentials: 'include',
        }
      )

      if (response.status !== 200) {
        throw new Error()
      }

      const json = await response.json()

      if (!json.steps?.verifyTaxInfo?.completed) {
        throw new Error()
      }
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
        <Text fontSize={5}>Tax information</Text>
        <Stack gap={2} py={6}>
          {isCompleted ? (
            <Text fontSize={2}>Tax information uploaded</Text>
          ) : (
            <FileUpload placeholder="Upload file" onFileChange={(file) => setTaxInfo(file)} disabled={isLoading} />
          )}
        </Stack>
        <Shelf gap="2">
          <Button onClick={() => backStep()} variant="secondary" disabled={isLoading}>
            Back
          </Button>
          <Button
            onClick={() => {
              isCompleted ? nextStep() : uploadTaxInfo()
            }}
            disabled={isCompleted ? false : isLoading || !taxInfo}
            loading={isLoading}
            loadingMessage="Uploading"
          >
            Next
          </Button>
        </Shelf>
      </Box>
    </Stack>
  )
}
