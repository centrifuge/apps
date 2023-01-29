import { Box, Button, FileUpload, Flex, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useMutation, useQuery } from 'react-query'
import { useAuth } from '../../components/AuthProvider'
import { useOnboardingUser } from '../../components/OnboardingUserProvider'
import { Spinner } from '../../components/Spinner'

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

  const isCompleted = !!onboardingUser?.steps?.verifyTaxInfo?.completed && !!taxInfo

  const { data: taxInfoData, isLoading: isTaxInfoLoading } = useQuery(
    ['tax info'],
    async () => {
      const response = await fetch(
        `${import.meta.env.REACT_APP_ONBOARDING_API_URL}/getTaxInfo?poolId=${poolId}&trancheId=${trancheId}`,
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

      const documentBlob = new Blob([Uint8Array.from(json.taxInfo.data).buffer], {
        type: 'application/pdf',
      })

      const file = new File([documentBlob], 'taxInfo.pdf', { type: 'application/pdf' })

      return file
    },
    {
      refetchOnWindowFocus: false,
      enabled: !!authToken,
    }
  )

  React.useEffect(() => {
    if (taxInfoData) {
      setTaxInfo(taxInfoData)
    }
  }, [taxInfoData])

  const { mutate: uploadTaxInfo, isLoading } = useMutation(
    async () => {
      if (taxInfo) {
        const formData = new FormData()
        formData.append('taxInfo', taxInfo)

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
      }
    },
    {
      onSuccess: () => {
        refetchOnboardingUser()
        nextStep()
      },
    }
  )

  const validateFileUpload = (file: File) => {
    if (file.type !== 'application/pdf') {
      return 'Only PDF files are allowed'
    }

    if (file.size > 1024 * 1024) {
      return 'Maximum file size allowed is 1MB'
    }
  }

  return (
    <Stack gap={4}>
      <Box>
        <Text fontSize={5}>Tax information</Text>
        {isTaxInfoLoading ? (
          <Flex alignItems="center" justifyContent="center" py={100}>
            <Spinner />
          </Flex>
        ) : (
          <>
            <Stack gap={2} py={6}>
              <FileUpload
                placeholder="Upload file"
                onFileChange={setTaxInfo}
                disabled={isLoading}
                file={taxInfo}
                validate={validateFileUpload}
              />
            </Stack>
            <Shelf gap="2">
              <Button onClick={() => backStep()} variant="secondary" disabled={isLoading}>
                Back
              </Button>

              <Button
                onClick={() => {
                  isCompleted && taxInfo === taxInfoData ? nextStep() : uploadTaxInfo()
                }}
                disabled={isCompleted ? false : isLoading || !taxInfo}
                loading={isLoading}
                loadingMessage="Uploading"
              >
                Next
              </Button>
            </Shelf>
          </>
        )}
      </Box>
    </Stack>
  )
}
