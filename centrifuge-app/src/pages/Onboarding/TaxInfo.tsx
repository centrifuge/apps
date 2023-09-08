import { AnchorButton, Box, RadioButton, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { FileUpload } from '../../components/Onboarding'
import { useOnboarding } from '../../components/OnboardingProvider'
import { OnboardingUser } from '../../types'
import { useTaxInfo } from './queries/useTaxInfo'

type TaxInfoProps = {
  value: File | undefined | string
  setValue: (value: File | null | string) => void
  touched: boolean | undefined
  error: string | undefined
}

export const TaxInfo = ({ value, setValue, touched, error }: TaxInfoProps) => {
  const { onboardingUser, pool } = useOnboarding<NonNullable<OnboardingUser>>()
  const { data: taxInfoData } = useTaxInfo()
  const [uploadNewFile, setUploadNewFile] = React.useState(false)

  React.useEffect(() => {
    if (!uploadNewFile && taxInfoData) {
      setValue(taxInfoData)
    }
    if (uploadNewFile) {
      setValue(null)
    }
  }, [uploadNewFile, taxInfoData])

  const isCompleted = !!onboardingUser.taxDocument

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
        url: 'https://www.irs.gov',
        label: 'www.irs.gov',
      }
    }

    if (onboardingUser.investorType === 'entity' && !onboardingUser.jurisdictionCode.startsWith('us')) {
      return {
        type: 'W-8BEN-E',
        url: 'https://www.irs.gov',
        label: 'www.irs.gov',
      }
    }

    return {
      type: 'W9',
      url: 'https://www.irs.gov',
      label: 'www.irs.gov',
    }
  }, [onboardingUser])

  return (
    <Stack gap={2}>
      <Text variant="heading2">Tax Information</Text>
      <Text variant="body1">
        {pool?.name} requires all investors to provide a completed {taxForm.type} form. The form can be found at{' '}
        <a href={taxForm.url} target="_blank" rel="noreferrer">
          {taxForm.label}
        </a>
        .
      </Text>

      {isCompleted && (
        <Stack gap={1}>
          <Text variant="body1">Choose to use an existing tax form or upload a new one</Text>
          <Shelf gap={2}>
            <RadioButton
              label="New"
              name="useUploadedFile"
              checked={uploadNewFile}
              onChange={() => setUploadNewFile(true)}
            />
            <RadioButton
              label="Existing"
              name="useUploadedFile"
              checked={!uploadNewFile}
              onChange={() => setUploadNewFile(false)}
            />
          </Shelf>
        </Stack>
      )}

      <Stack gap={2}>
        {uploadNewFile && (
          <FileUpload
            onFileChange={setValue}
            file={value || null}
            errorMessage={touched ? error : undefined}
            validate={validateFileUpload}
            accept=".pdf"
          />
        )}
        {isCompleted && !uploadNewFile && (
          <Box>
            <AnchorButton variant="secondary" href={taxInfoData} target="__blank">
              View tax form
            </AnchorButton>
          </Box>
        )}
      </Stack>
    </Stack>
  )
}
