import { useWallet } from '@centrifuge/centrifuge-react'
import { Box, Button, DateInput, InlineFeedback, NumberInput, Select, Stack, Text, TextInput } from '@centrifuge/fabric'
import { useFormik } from 'formik'
import { useMutation } from 'react-query'
import { date, object, string } from 'yup'
import { useAuth } from '../../components/AuthProvider'
import { ultimateBeneficialOwner } from '../../types'
import { StyledInlineFeedback } from './StyledInlineFeedback'

type Props = {
  nextStep: () => void
  setUltimateBeneficialOwners: (owners: ultimateBeneficialOwner[]) => void
}

// TODO: make dynamic based on the pool and tranche that the user is onboarding to
const trancheId = 'sdf'
const poolId = '21323432'

const businessVerificationInput = object({
  email: string().email().required(),
  entityName: string().required(),
  registrationNumber: string().required(),
  countryOfIncorporation: string().required(),
  businessIncorporationDate: date().required().max(new Date()),
})

const BusinessInformationInlineFeedback = ({ isError }: { isError: boolean }) => {
  if (isError) {
    return (
      <StyledInlineFeedback>
        <InlineFeedback status="warning">
          <Text fontSize="14px">
            Unable to verify business information or business has already been verified. Please try again or contact
            support@centrifuge.io.
          </Text>
        </InlineFeedback>
      </StyledInlineFeedback>
    )
  }

  return null
}

export const BusinessInformation = ({ nextStep, setUltimateBeneficialOwners }: Props) => {
  const { selectedAccount } = useWallet()
  const { authToken } = useAuth()

  const formik = useFormik({
    initialValues: {
      entityName: '',
      email: '',
      registrationNumber: '',
      countryOfIncorporation: '',
      businessIncorporationDate: '',
    },
    onSubmit: () => {
      verifyBusinessInformation()
    },
    validationSchema: businessVerificationInput,
    validateOnMount: true,
  })

  const {
    mutate: verifyBusinessInformation,
    isLoading,
    isError,
  } = useMutation(
    async () => {
      const response = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/businessVerification`, {
        method: 'POST',
        body: JSON.stringify({
          email: formik.values.email,
          businessName: formik.values.entityName,
          companyRegistrationNumber: formik.values.registrationNumber,
          companyJurisdictionCode: formik.values.countryOfIncorporation,
          businessIncorporationDate: formik.values.businessIncorporationDate,
          trancheId,
          poolId,
          address: selectedAccount?.address,
          dryRun: true,
        }),
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.status !== 200) {
        throw new Error()
      }

      const json = await response.json()

      if (json.errors.length) {
        throw new Error()
      }

      setUltimateBeneficialOwners(json.ultimateBeneficialOwners)

      return json.ultimateBeneficialOwners
    },
    { onSuccess: () => nextStep() }
  )

  return (
    <Stack gap={4}>
      <Box>
        <BusinessInformationInlineFeedback isError={isError} />
        <Text fontSize={5}>Provide information about your business</Text>
        <Text fontSize={2}>
          Please verify email address, legal entity name, business incorporation date and country of incorporation and
          registration number.
        </Text>
        <Stack gap={2} py={6} width="493px">
          <TextInput
            id="email"
            label="Email address*"
            placeholder="Enter email address"
            disabled={isLoading}
            onChange={formik.handleChange}
            value={formik.values.email}
          />
          <TextInput
            id="entityName"
            label="Legal entity name*"
            placeholder="Enter entity name"
            disabled={isLoading}
            onChange={formik.handleChange}
            value={formik.values.entityName}
          />
          <Select
            label="Country of incorporation*"
            placeholder="Select a country"
            options={[
              {
                label: 'Switzerland',
                value: 'ch',
              },
            ]}
            disabled={isLoading}
            onSelect={(countryCode) => formik.setFieldValue('countryOfIncorporation', countryCode)}
            value={formik.values.countryOfIncorporation}
          />
          <NumberInput
            id="registrationNumber"
            label="Registration number*"
            placeholder="0000"
            disabled={isLoading}
            onChange={formik.handleChange}
            value={formik.values.registrationNumber}
          />
          <DateInput
            id="businessIncorporationDate"
            label="Business Incorporation Date"
            disabled={isLoading}
            onChange={formik.handleChange}
            value={formik.values.businessIncorporationDate}
          />
        </Stack>
      </Box>
      <Box>
        <Button
          onClick={formik.submitForm}
          loading={isLoading}
          disabled={isLoading || !formik.isValid}
          loadingMessage="Verifying"
        >
          Verify
        </Button>
      </Box>
    </Stack>
  )
}
