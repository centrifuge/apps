import { Box, Button, Checkbox, DateInput, Select, Shelf, Stack, Text, TextInput } from '@centrifuge/fabric'
import { FormikProps } from 'formik'

type Props = {
  backStep: () => void
  formik: FormikProps<{
    name: string
    dateOfBirth: string
    countryOfCitizenship: string
    isAccurate: boolean
  }>
}

export const AuthorizedSignerVerification = ({ backStep, formik }: Props) => {
  return (
    <Stack gap={4}>
      <Box>
        <Text fontSize={5}>Authorized signer verification</Text>
        <Text fontSize={2}>
          Please add name of authorized signer (person who controls the wallet) to complete verification.
        </Text>
        <Stack gap={2} py={6} width="493px">
          <TextInput id="name" value={formik.values.name} label="Full Name*" onChange={formik.handleChange} />
          <DateInput
            id="dateOfBirth"
            value={formik.values.dateOfBirth}
            label="Date of Birth*"
            onChange={formik.handleChange}
          />
          <Select
            label="Country of Citizenship*"
            placeholder="Select a country"
            options={[
              {
                label: 'Switzerland',
                value: 'ch',
              },
            ]}
            onSelect={(countryCode) => formik.setFieldValue('countryOfCitizenship', countryCode)}
            value={formik.values.countryOfCitizenship}
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
          />
        </Box>
      </Box>
      <Shelf gap="2">
        <Button onClick={() => backStep()} variant="secondary">
          Back
        </Button>
        <Button disabled={!formik.isValid} onClick={() => formik.submitForm()}>
          Next
        </Button>
      </Shelf>
    </Stack>
  )
}
