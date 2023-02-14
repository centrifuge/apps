import { useWallet } from '@centrifuge/centrifuge-react'
import { AnchorButton, Box, Button, FileUpload, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useMutation, useQuery } from 'react-query'
import { useAuth } from '../../components/AuthProvider'
import { useOnboarding } from '../../components/OnboardingProvider'

type Props = {
  nextStep: () => void
  backStep: () => void
}

export const TaxInfo = ({ backStep, nextStep }: Props) => {
  const { selectedAccount } = useWallet()
  const { refetchOnboardingUser, onboardingUser, pool } = useOnboarding()
  const [taxInfo, setTaxInfo] = React.useState<File | null>(null)
  const { authToken } = useAuth()

  const isCompleted = !!onboardingUser?.steps?.verifyTaxInfo?.completed

  const { data: taxInfoData } = useQuery(
    ['tax info', selectedAccount?.address],
    async () => {
      const response = await fetch(
        `${import.meta.env.REACT_APP_ONBOARDING_API_URL}/getTaxInfo?poolId=${pool.id}&trancheId=${pool.trancheId}`,
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

      return URL.createObjectURL(documentBlob)
    },
    {
      refetchOnWindowFocus: false,
      enabled: !!onboardingUser?.steps?.verifyTaxInfo?.completed,
    }
  )

  const { mutate: uploadTaxInfo, isLoading } = useMutation(
    async () => {
      if (taxInfo) {
        const formData = new FormData()
        formData.append('taxInfo', taxInfo)

        const response = await fetch(
          `${import.meta.env.REACT_APP_ONBOARDING_API_URL}/uploadTaxInfo?poolId=${pool.id}&trancheId=${pool.trancheId}`,
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

  const taxForm = React.useMemo(() => {
    if (onboardingUser.investorType === 'individual' && onboardingUser.countryOfCitizenship !== 'us') {
      return {
        type: 'W-8BEN',
        url: 'https://www.irs.gov/pub/irs-pdf/fw8ben.pdf',
      }
    }

    if (onboardingUser.investorType === 'entity' && !onboardingUser.jurisdictionCode.startsWith('us')) {
      return {
        type: 'W-8BEN-E',
        url: 'https://www.irs.gov/pub/irs-pdf/fw8bene.pdf',
      }
    }

    return {
      type: 'W9',
      url: 'https://www.irs.gov/pub/irs-pdf/fw9.pdf',
    }
  }, [onboardingUser])

  return (
    <Stack gap={4}>
      <Box>
        <Text fontSize={5}>Tax information</Text>
        <Stack gap={4}>
          <Text fontSize={2}>
            Please complete and upload a {taxForm.type} form. The form can be found at{' '}
            <a href={taxForm.url} target="_blank" rel="noreferrer">
              {taxForm.url}
            </a>
            .
          </Text>
          {isCompleted ? (
            <Box>
              <AnchorButton variant="secondary" href={taxInfoData} target="__blank">
                View uploaded tax form
              </AnchorButton>
            </Box>
          ) : (
            <FileUpload
              placeholder="Upload file"
              onFileChange={(file) => setTaxInfo(file)}
              disabled={isLoading || isCompleted}
              file={taxInfo || null}
              validate={validateFileUpload}
            />
          )}
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
        </Stack>
      </Box>
    </Stack>
  )
}
