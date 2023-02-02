import { Box, Button, Checkbox, DateInput, Select, Shelf, Stack, Text, TextInput } from '@centrifuge/fabric'
import { FormikProps } from 'formik'
import { KYC_COUNTRY_CODES } from '../geography_codes'

type Props = {
  backStep: () => void
  formik: FormikProps<{
    name: string
    dateOfBirth: string
    countryOfCitizenship: string
    isAccurate: boolean
  }>
  isLoading: boolean
  isCompleted: boolean
  nextStep: () => void
}

const formatCountryCodes = (countryCodes: { [key: string]: string }) => {
  return Object.keys(countryCodes).map((key) => ({
    label: countryCodes[key],
    value: key,
  }))
}

export const AuthorizedSignerVerification = ({ backStep, formik, isLoading, isCompleted, nextStep }: Props) => (
  <Stack gap={4}>
    <Box>
      <Text fontSize={5}>Authorized signer verification</Text>
      <Text fontSize={2}>
        Please add name of authorized signer (person who controls the wallet) to complete verification.
      </Text>
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
          name="country-citizenship"
          label="Country of Citizenship*"
          placeholder="Select a country"
          options={formatCountryCodes(KYC_COUNTRY_CODES)}
          onChange={(event) => formik.setFieldValue('countryOfCitizenship', event.target.value)}
          value={formik.values.countryOfCitizenship}
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
          label="I confirm that all the information provided is true and accurate, and I am the authorized signer."
          disabled={isLoading || isCompleted}
        />
      </Box>
    </Box>
    <Shelf gap="2">
      <Button onClick={() => backStep()} variant="secondary" disabled={isLoading}>
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
