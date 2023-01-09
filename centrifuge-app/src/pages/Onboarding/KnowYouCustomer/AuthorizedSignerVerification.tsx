import { Box, Button, Checkbox, DateInput, InlineFeedback, Select, Stack, Text, TextInput } from '@centrifuge/fabric'
import { useFormik } from 'formik'
import { useState } from 'react'
import { useMutation } from 'react-query'
import { date, object, string } from 'yup'
import { useAuth } from '../../../components/AuthProvider'
import { StyledInlineFeedback } from '../StyledInlineFeedback'

type Props = {
  nextKnowYourCustomerStep: () => void
}

const authorizedSignerInput = object({
  name: string().required(),
  dateOfBirth: date().required().min(new Date(1900, 0, 1)).max(new Date()),
  countryOfCitizenship: string().required(),
})

const AuthorizedSignerInlineFeedback = ({ isError }: { isError: boolean }) => {
  if (isError) {
    return (
      <StyledInlineFeedback>
        <InlineFeedback status="warning">
          <Text fontSize="14px">
            Unable to verify authorized signer or authorized signer has already been verified. Please try again or
            contact support@centrifuge.io.
          </Text>
        </InlineFeedback>
      </StyledInlineFeedback>
    )
  }

  return null
}

export const AuthorizedSignerVerification = ({ nextKnowYourCustomerStep }: Props) => {
  const { authToken } = useAuth()
  const [isAccurate, setIsAccurate] = useState(false)

  const formik = useFormik({
    initialValues: {
      name: '',
      dateOfBirth: '',
      countryOfCitizenship: '',
    },
    onSubmit: () => {
      verifyAuthorizeSigner()
    },
    validationSchema: authorizedSignerInput,
    validateOnMount: true,
  })

  const {
    mutate: verifyAuthorizeSigner,
    isLoading,
    isError,
  } = useMutation(
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 3000))
      // const response = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/authorizedSignerVerification`, {
      //   method: 'POST',
      //   body: JSON.stringify({}),
      //   headers: {
      //     Authorization: `Bearer ${authToken}`,
      //     'Content-Type': 'application/json',
      //   },
      //   credentials: 'include',
      // })

      // if (response.status !== 200) {
      //   throw new Error()
      // }
    },
    {
      onSuccess: () => {
        nextKnowYourCustomerStep()
      },
    }
  )

  return (
    <Stack gap={4}>
      <Box>
        <AuthorizedSignerInlineFeedback isError={isError} />
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
            disabled={isLoading}
          />
          <DateInput
            id="dateOfBirth"
            value={formik.values.dateOfBirth}
            label="Date of Birth*"
            onChange={formik.handleChange}
            disabled={isLoading}
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
            disabled={isLoading}
            onSelect={(countryCode) => formik.setFieldValue('countryOfCitizenship', countryCode)}
            value={formik.values.countryOfCitizenship}
          />
        </Stack>
        <Box>
          <Checkbox
            disabled={isLoading}
            style={{
              cursor: 'pointer',
            }}
            checked={isAccurate}
            onChange={() => setIsAccurate((current) => !current)}
            label="I confirm that all the information provided is true and accurate, and I am the authorized signer."
          />
        </Box>
      </Box>

      <Box>
        <Button
          onClick={formik.submitForm}
          loading={isLoading}
          disabled={isLoading || !isAccurate || !formik.isValid}
          loadingMessage="Verifying"
        >
          Verify
        </Button>
      </Box>
    </Stack>
  )
}
