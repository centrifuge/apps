import { Box, Button, Checkbox, DateInput, Select, Shelf, Stack, Text, TextInput } from '@centrifuge/fabric'
import { FormikProps } from 'formik'
import { useOnboarding } from '../../../components/OnboardingProvider'
import { KYC_COUNTRY_CODES, RESIDENCE_COUNTRY_CODES } from '../geographyCodes'

type Props = {
  formik: FormikProps<{
    name: string
    dateOfBirth: string
    countryOfCitizenship: string
    countryOfResidence: string
    isAccurate: boolean
  }>
  isLoading: boolean
  isCompleted: boolean
}

const formatCountryCodes = (countryCodes: { [key: string]: string }) => {
  return Object.keys(countryCodes).map((key) => ({
    label: countryCodes[key],
    value: key,
  }))
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
    <Stack gap={4}>
      <Box>
        <Text fontSize={5}>{copy[investorType].title}</Text>
        <Text fontSize={2}>{copy[investorType].description}</Text>
        <Stack gap={2} py={6} width="493px">
          <TextInput
            id="name"
            value={formik.values.name}
            label="Full Name*"
            onChange={formik.handleChange}
            disabled={isLoading || isCompleted}
          />
          <DateInput
            id="dateOfBirth"
            value={formik.values.dateOfBirth}
            label="Date of Birth*"
            onChange={formik.handleChange}
            disabled={isLoading || isCompleted}
          />
          <Select
            name="countryOfCitizenship"
            label="Country of Citizenship*"
            placeholder="Select a country"
            options={formatCountryCodes(KYC_COUNTRY_CODES)}
            onChange={(event) => formik.setFieldValue('countryOfCitizenship', event.target.value)}
            value={formik.values.countryOfCitizenship}
            disabled={isLoading || isCompleted}
          />
          <Select
            name="countryOfResidence"
            label="Country of Residence*"
            placeholder="Select a country"
            options={formatCountryCodes(RESIDENCE_COUNTRY_CODES)}
            onChange={(event) => formik.setFieldValue('countryOfResidence', event.target.value)}
            value={formik.values.countryOfResidence}
            disabled={isLoading || isCompleted}
          />
        </Stack>
        <Box>
          <Checkbox
            id="isAccurate"
            style={{
              cursor: 'pointer',
            }}
            checked={formik.values.isAccurate}
            onChange={formik.handleChange}
            label={copy[investorType].checkboxLabel}
            disabled={isLoading || isCompleted}
          />
        </Box>
      </Box>
      <Shelf gap="2">
        <Button onClick={() => previousStep()} variant="secondary" disabled={isLoading}>
          Back
        </Button>
        <Button
          onClick={() => {
            isCompleted ? nextStep() : formik.submitForm()
          }}
          loading={isLoading}
          disabled={isLoading || !formik.isValid}
          loadingMessage="Verifying"
        >
          Next
        </Button>
      </Shelf>
    </Stack>
  )
}
