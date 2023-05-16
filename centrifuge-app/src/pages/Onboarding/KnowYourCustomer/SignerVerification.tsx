import { Box, Button, Checkbox, DateInput, Select, Text, TextInput } from '@centrifuge/fabric'
import { FormikProps } from 'formik'
import { ActionBar, Content, ContentHeader, Fieldset, ValidEmailTooltip } from '../../../components/Onboarding'
import { useOnboarding } from '../../../components/OnboardingProvider'
import { formatGeographyCodes } from '../../../utils/formatGeographyCodes'
import { KYC_COUNTRY_CODES, RESIDENCY_COUNTRY_CODES } from '../geographyCodes'

type Props = {
  formik: FormikProps<{
    name: string
    email: string | undefined
    dateOfBirth: string
    countryOfCitizenship: string
    countryOfResidency: string
    isAccurate: boolean
  }>
  isLoading: boolean
  isCompleted: boolean
}

const copy = {
  entity: {
    title: 'Authorized signer verification',
    description:
      'Please add the information of the authorized signer (person who controls the wallet) to complete verification.',
    checkboxLabel: 'I confirm that all the information provided is true and accurate, and I am the authorized signer.',
  },
  individual: {
    title: 'Signer verification',
    description: 'Please add your information to complete verification.',
    checkboxLabel: 'I confirm that all the information provided is true and accurate.',
  },
}

export const SignerVerification = ({ formik, isLoading, isCompleted }: Props) => {
  const { previousStep, nextStep, onboardingUser } = useOnboarding()

  const investorType = onboardingUser?.investorType === 'entity' ? 'entity' : 'individual'

  return (
    <>
      <Content>
        <ContentHeader title={copy[investorType].title} body={copy[investorType].description} />

        <Fieldset>
          <TextInput
            {...formik.getFieldProps('name')}
            label="Full Name"
            disabled={isLoading || isCompleted}
            errorMessage={formik.touched.name ? formik.errors.name : undefined}
          />
          {investorType === 'individual' && (
            <Box position="relative">
              <TextInput
                {...formik.getFieldProps('email')}
                label="Email address"
                placeholder="Enter email address"
                disabled={isLoading || isCompleted}
                errorMessage={formik.touched.email ? formik.errors.email : undefined}
              />
              <ValidEmailTooltip />
            </Box>
          )}
          <DateInput
            {...formik.getFieldProps('dateOfBirth')}
            label="Date of Birth"
            disabled={isLoading || isCompleted}
            errorMessage={formik.touched.dateOfBirth ? formik.errors.dateOfBirth : undefined}
          />
          <Select
            {...formik.getFieldProps('countryOfCitizenship')}
            label="Country of Citizenship"
            placeholder="Select a country"
            options={formatGeographyCodes(KYC_COUNTRY_CODES)}
            disabled={isLoading || isCompleted}
            errorMessage={formik.touched.countryOfCitizenship ? formik.errors.countryOfCitizenship : undefined}
          />
          <Select
            {...formik.getFieldProps('countryOfResidency')}
            label="Country of Residence"
            placeholder="Select a country"
            options={formatGeographyCodes(RESIDENCY_COUNTRY_CODES)}
            disabled={isLoading || isCompleted}
            errorMessage={formik.touched.countryOfResidency ? formik.errors.countryOfResidency : undefined}
          />
        </Fieldset>
        <Box>
          <Checkbox
            {...formik.getFieldProps('isAccurate')}
            checked={formik.values.isAccurate}
            label={<Text style={{ cursor: 'pointer', paddingLeft: '6px' }}>{copy[investorType].checkboxLabel}</Text>}
            disabled={isLoading || isCompleted}
            errorMessage={formik.touched.isAccurate ? formik.errors.isAccurate : undefined}
          />
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
          loading={isLoading}
          disabled={isLoading}
          loadingMessage="Verifying"
        >
          Next
        </Button>
      </ActionBar>
    </>
  )
}
