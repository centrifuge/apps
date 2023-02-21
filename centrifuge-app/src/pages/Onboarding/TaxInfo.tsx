import { AnchorButton, Box, Button, FileUpload, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useOnboarding } from '../../components/OnboardingProvider'
import { useTaxInfo } from './queries/useTaxInfo'
import { useUploadTaxInfo } from './queries/useUploadTaxInfo'

export const TaxInfo = () => {
  const { onboardingUser, previousStep, nextStep } = useOnboarding()
  const [taxInfo, setTaxInfo] = React.useState<File | null>(null)
  const { data: taxInfoData } = useTaxInfo()
  const { mutate: uploadTaxInfo, isLoading } = useUploadTaxInfo(taxInfo)

  const isCompleted = !!onboardingUser?.steps?.verifyTaxInfo?.completed

  const validateFileUpload = (file: File) => {
    if (file.type !== 'application/pdf') {
      return 'Only PDF files are allowed'
    }

    if (file.size > 1024 * 1024) {
      return 'Maximum file size allowed is 1MB'
    }
  }

  const taxForm = React.useMemo(() => {
    if (onboardingUser?.investorType === 'individual' && onboardingUser?.countryOfCitizenship !== 'us') {
      return {
        type: 'W-8BEN',
        url: 'https://www.irs.gov/pub/irs-pdf/fw8ben.pdf',
      }
    }

    if (onboardingUser?.investorType === 'entity' && !onboardingUser?.jurisdictionCode.startsWith('us')) {
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
            <Button onClick={() => previousStep()} variant="secondary" disabled={isLoading}>
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
