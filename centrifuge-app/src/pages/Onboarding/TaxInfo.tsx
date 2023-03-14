import { AnchorButton, Box, Button } from '@centrifuge/fabric'
import { useFormik } from 'formik'
import * as React from 'react'
import { mixed, object } from 'yup'
import { ActionBar, Content, ContentHeader, FileUpload } from '../../components/Onboarding'
import { useOnboarding } from '../../components/OnboardingProvider'
import { OnboardingUser } from '../../types'
import { useTaxInfo } from './queries/useTaxInfo'
import { useUploadTaxInfo } from './queries/useUploadTaxInfo'

const validationSchema = object({
  taxInfo: mixed().required('Please upload a tax form'),
})

export const TaxInfo = () => {
  const { onboardingUser, previousStep, nextStep } = useOnboarding<NonNullable<OnboardingUser>>()
  const { data: taxInfoData } = useTaxInfo()
  const { mutate: uploadTaxInfo, isLoading } = useUploadTaxInfo()

  const isCompleted = !!onboardingUser.globalSteps.verifyTaxInfo.completed

  const formik = useFormik({
    initialValues: {
      taxInfo: undefined,
    },
    validationSchema,
    onSubmit: (values: { taxInfo: File | undefined }) => {
      uploadTaxInfo(values.taxInfo)
    },
  })

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
              onFileChange={(file) => formik.setFieldValue('taxInfo', file)}
              disabled={isLoading || isCompleted}
              file={formik.values.taxInfo || null}
              errorMessage={formik.errors.taxInfo}
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
            isCompleted ? nextStep() : formik.handleSubmit()
          }}
          disabled={isLoading}
          loading={isLoading}
          loadingMessage="Uploading"
        >
          Next
        </Button>
      </ActionBar>
    </>
  )
}
