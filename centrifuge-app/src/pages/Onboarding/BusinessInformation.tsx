import {
  Box,
  Button,
  Card,
  DateInput,
  Flex,
  InlineFeedback,
  NumberInput,
  Select,
  Shelf,
  Stack,
  Text,
  TextInput,
} from '@centrifuge/fabric'
import { useFormik } from 'formik'
import { useMutation } from 'react-query'
import { date, object, string } from 'yup'
import { useAuth } from '../../components/AuthProvider'
import { useOnboardingUser } from '../../components/OnboardingUserProvider'
import { EntityUser } from '../../types'
import { formatGeographyCodes } from '../../utils/formatGeographyCodes'
import { CA_PROVINCE_CODES, KYB_COUNTRY_CODES, US_STATE_CODES } from './geography_codes'
import { StyledInlineFeedback } from './StyledInlineFeedback'

type Props = {
  nextStep: () => void
  backStep: () => void
}

// TODO: make dynamic based on the pool and tranche that the user is onboarding to
const trancheId = 'FAKETRANCHEID'
const poolId = 'FAKEPOOLID'

const businessVerificationInput = object({
  email: string().email().required(),
  businessName: string().required(),
  registrationNumber: string().required(),
  jurisdictionCode: string().required(),
  incorporationDate: date().required().max(new Date()),
  regionCode: string().when('jurisdictionCode', {
    is: (jurisdictionCode: string) => jurisdictionCode === 'us' || jurisdictionCode === 'ca',
    then: string().required(),
  }),
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

export const BusinessInformation = ({ backStep, nextStep }: Props) => {
  const { authToken } = useAuth()
  const { onboardingUser, refetchOnboardingUser } = useOnboardingUser() as {
    onboardingUser: EntityUser
    refetchOnboardingUser: () => void
  }

  const isUSOrCA =
    onboardingUser?.jurisdictionCode?.startsWith('us') || onboardingUser?.jurisdictionCode?.startsWith('ca')

  const isCompleted = !!onboardingUser?.steps?.verifyBusiness.completed

  const formik = useFormik({
    initialValues: {
      businessName: onboardingUser?.businessName || '',
      email: onboardingUser?.email || '',
      registrationNumber: onboardingUser?.registrationNumber || '',
      jurisdictionCode: isUSOrCA
        ? onboardingUser?.jurisdictionCode.slice(0, 2)
        : onboardingUser?.jurisdictionCode || '',
      incorporationDate: onboardingUser?.incorporationDate || '',
      regionCode: isUSOrCA ? onboardingUser?.jurisdictionCode.split('_')[1] : '',
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
      const response = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/verifyBusiness`, {
        method: 'POST',
        body: JSON.stringify({
          email: formik.values.email,
          businessName: formik.values.businessName,
          registrationNumber: formik.values.registrationNumber,
          jurisdictionCode:
            formik.values.jurisdictionCode === 'us' || formik.values.jurisdictionCode === 'ca'
              ? `${formik.values.jurisdictionCode}_${formik.values.regionCode}`
              : formik.values.jurisdictionCode,
          incorporationDate: formik.values.incorporationDate,
          trancheId,
          poolId,
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

      if (!json.steps?.verifyBusiness?.completed) {
        throw new Error()
      }
    },
    {
      onSuccess: () => {
        refetchOnboardingUser()
        nextStep()
      },
    }
  )

  const renderRegionCodeSelect = () => {
    if (formik.values.jurisdictionCode === 'us') {
      return (
        <Select
          name="regionCode"
          label="State of incorporation*"
          placeholder="Select a state"
          options={formatGeographyCodes(US_STATE_CODES)}
          disabled={isLoading || isCompleted}
          onChange={(event) => formik.setFieldValue('regionCode', event.target.value)}
          value={formik.values.regionCode}
        />
      )
    }

    if (formik.values.jurisdictionCode === 'ca') {
      return (
        <Select
          name="regionCode"
          label="Province of incorporation*"
          placeholder="Select a province"
          options={formatGeographyCodes(CA_PROVINCE_CODES)}
          disabled={isLoading || isCompleted}
          onChange={(event) => formik.setFieldValue('regionCode', event.target.value)}
          value={formik.values.regionCode}
        />
      )
    }

    return null
  }

  return (
    <Stack gap={4}>
      <Box>
        <BusinessInformationInlineFeedback isError={isError} />
        <Text fontSize={5}>Provide information about your business</Text>
        <Text fontSize={2}>
          Please verify email address, legal entity name, business incorporation date and country of incorporation and
          registration number.
        </Text>
      </Box>
      <Shelf gap={4}>
        <Stack gap={2} width="493px">
          <TextInput
            id="email"
            label="Email address*"
            placeholder="Enter email address"
            disabled={isLoading || isCompleted}
            onChange={formik.handleChange}
            value={formik.values.email}
          />
          <TextInput
            id="businessName"
            label="Legal entity name*"
            placeholder="Enter entity name"
            disabled={isLoading || isCompleted}
            onChange={formik.handleChange}
            value={formik.values.businessName}
          />
          <Select
            name="jurisdictionCode"
            label="Country of incorporation*"
            placeholder="Select a country"
            options={formatGeographyCodes(KYB_COUNTRY_CODES)}
            disabled={isLoading || isCompleted}
            onChange={(event) => {
              formik.setValues({
                ...formik.values,
                jurisdictionCode: event.target.value,
                regionCode: '',
              })
            }}
            value={formik.values.jurisdictionCode}
          />
          {renderRegionCodeSelect()}

          <NumberInput
            id="registrationNumber"
            label="Registration number*"
            placeholder="0000"
            disabled={isLoading || isCompleted}
            onChange={formik.handleChange}
            value={formik.values.registrationNumber}
          />
          <DateInput
            id="incorporationDate"
            label="Business Incorporation Date"
            disabled={isLoading || isCompleted}
            onChange={formik.handleChange}
            value={formik.values.incorporationDate}
          />
        </Stack>
        <Flex alignSelf="flex-start">
          <Card
            width="260px"
            p={2}
            style={{
              backgroundColor: 'black',
            }}
          >
            <Stack gap={1}>
              <Text size="12px" fontWeight="600" color="white">
                Please enter a valid email
              </Text>
              <Text size="12px" color="white">
                Your email will be verified. Please make sure you have access to confirm.
              </Text>
            </Stack>
          </Card>
        </Flex>
      </Shelf>
      <Shelf gap={2}>
        <Button onClick={() => backStep()} disabled={isLoading} variant="secondary">
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
