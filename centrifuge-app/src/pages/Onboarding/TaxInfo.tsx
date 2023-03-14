import { AnchorButton, Box, Button } from '@centrifuge/fabric'
import * as React from 'react'
import { ActionBar, Content, ContentHeader, FileUpload } from '../../components/Onboarding'
import { useOnboarding } from '../../components/OnboardingProvider'
import { OnboardingUser } from '../../types'
import { useTaxInfo } from './queries/useTaxInfo'
import { useUploadTaxInfo } from './queries/useUploadTaxInfo'

export const TaxInfo = () => {
  const { onboardingUser, previousStep, nextStep } = useOnboarding<NonNullable<OnboardingUser>>()
  const [taxInfo, setTaxInfo] = React.useState<File | null>(null)
  const { data: taxInfoData } = useTaxInfo()
  const { mutate: uploadTaxInfo, isLoading } = useUploadTaxInfo(taxInfo)

  const isCompleted = !!onboardingUser.globalSteps.verifyTaxInfo.completed

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
        label: 'www.irs.gov/pub/irs-pdf/fw8ben.pdf',
      }
    }

    if (onboardingUser.investorType === 'entity' && !onboardingUser.jurisdictionCode.startsWith('us')) {
      return {
        type: 'W-8BEN-E',
        url: 'https://www.irs.gov/pub/irs-pdf/fw8bene.pdf',
        label: 'www.irs.gov/pub/irs-pdf/fw8bene.pdf',
      }
    }

    return {
      type: 'W9',
      url: 'https://www.irs.gov/pub/irs-pdf/fw9.pdf',
      label: 'www.irs.gov/pub/irs-pdf/fw9.pdf',
    }
  }, [onboardingUser])

  return (
    <>
      <Content>
        <ContentHeader
          title="Tax information"
          body={
            <>
              Please complete and upload a {taxForm.type} form. The form can be found at{' '}
              <a href={taxForm.url} target="_blank" rel="noreferrer">
                {taxForm.label}
              </a>
              .
            </>
          }
        />

        <Box>
          {isCompleted ? (
            <Box>
              <AnchorButton variant="secondary" href={taxInfoData} target="__blank">
                View uploaded tax form
              </AnchorButton>
            </Box>
          ) : (
            <FileUpload
              onFileChange={(file) => setTaxInfo(file as File)}
              disabled={isLoading || isCompleted}
              file={taxInfo || null}
              validate={validateFileUpload}
              accept=".pdf"
            />
          )}
        </Box>
      </Content>

      <ActionBar>
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
      </ActionBar>
    </>
  )
}
