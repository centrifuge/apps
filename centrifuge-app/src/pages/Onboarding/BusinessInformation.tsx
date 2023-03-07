import { Box, Button, Select, TextInput } from '@centrifuge/fabric'
import { useFormik } from 'formik'
import * as React from 'react'
import { object, string } from 'yup'
import {
  ActionBar,
  AlertBusinessVerification,
  Content,
  ContentHeader,
  Fieldset,
  NotificationBar,
  ValidEmailTooltip,
} from '../../components/Onboarding'
import { useOnboarding } from '../../components/OnboardingProvider'
import { EntityUser } from '../../types'
import { formatGeographyCodes } from '../../utils/formatGeographyCodes'
import { CA_PROVINCE_CODES, KYB_COUNTRY_CODES, US_STATE_CODES } from './geographyCodes'
import { useVerifyBusiness } from './queries/useVerifyBusiness'

const businessVerificationInput = object({
  email: string().email().required(),
  businessName: string().required(),
  registrationNumber: string().required(),
  jurisdictionCode: string().required(),
  regionCode: string().when('jurisdictionCode', {
    is: (jurisdictionCode: string) => jurisdictionCode === 'us' || jurisdictionCode === 'ca',
    then: string().required(),
  }),
})

export const BusinessInformation = () => {
  const { onboardingUser, previousStep, nextStep } = useOnboarding<EntityUser>()
  const [errorClosed, setErrorClosed] = React.useState(false)

  const isUSOrCA =
    onboardingUser?.jurisdictionCode?.startsWith('us') || onboardingUser?.jurisdictionCode?.startsWith('ca')

  const isCompleted = !!onboardingUser?.globalSteps?.verifyBusiness.completed

  const formik = useFormik({
    initialValues: {
      businessName: onboardingUser?.businessName || '',
      email: onboardingUser?.email || '',
      registrationNumber: onboardingUser?.registrationNumber || '',
      jurisdictionCode:
        (isUSOrCA ? onboardingUser?.jurisdictionCode.slice(0, 2) : onboardingUser?.jurisdictionCode || '') ?? '',
      regionCode: (isUSOrCA ? onboardingUser?.jurisdictionCode.split('_')[1] : '') ?? '',
    },
    onSubmit: (values) => {
      verifyBusinessInformation(values)
    },
    validationSchema: businessVerificationInput,
    validateOnMount: true,
  })

  const { mutate: verifyBusinessInformation, isLoading, isError } = useVerifyBusiness()

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
    <>
      <Content>
        {isError && !errorClosed && (
          <NotificationBar>
            <AlertBusinessVerification onClose={() => setErrorClosed(true)} />
          </NotificationBar>
        )}

        <ContentHeader
          title="Provide information about your business"
          body="Please verify email address, legal entity name, business incorporation date and country of incorporation and
      registration number."
        />

        <Fieldset>
          <Box position="relative">
            <TextInput
              id="email"
              label="Email address"
              placeholder="Enter email address"
              disabled={isLoading || isCompleted}
              onChange={formik.handleChange}
              value={formik.values.email}
            />
            <ValidEmailTooltip />
          </Box>

          <TextInput
            id="businessName"
            label="Legal entity name"
            placeholder="Enter entity name"
            disabled={isLoading || isCompleted}
            onChange={formik.handleChange}
            value={formik.values.businessName}
          />

          <Select
            name="jurisdictionCode"
            label="Country of incorporation"
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

          <TextInput
            id="registrationNumber"
            label="Registration number"
            placeholder="0000"
            disabled={isLoading || isCompleted}
            onChange={formik.handleChange}
            value={formik.values.registrationNumber}
          />
        </Fieldset>
      </Content>

      <ActionBar>
        <Button onClick={() => previousStep()} disabled={isLoading} variant="secondary">
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
      </ActionBar>
    </>
  )
}
