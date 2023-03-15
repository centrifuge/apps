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

const validationSchema = object({
  email: string().email('Please enter a valid email address').required('Please enter an email address'),
  businessName: string().required('Please enter the business name'),
  registrationNumber: string().required('Please enter the business registration number'),
  jurisdictionCode: string().required('Please select the business country of incorporation'),
  regionCode: string().when('jurisdictionCode', {
    is: (jurisdictionCode: string) => jurisdictionCode === 'us' || jurisdictionCode === 'ca',
    then: string().required('Please select your region code'),
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
    validationSchema,
  })

  const { mutate: verifyBusinessInformation, isLoading, isError } = useVerifyBusiness()

  const renderRegionCodeSelect = () => {
    if (formik.values.jurisdictionCode === 'us') {
      return (
        <Select
          {...formik.getFieldProps('regionCode')}
          label="State of incorporation"
          placeholder="Select a state"
          options={formatGeographyCodes(US_STATE_CODES)}
          disabled={isLoading || isCompleted}
          errorMessage={formik.touched.regionCode ? formik.errors.regionCode : undefined}
        />
      )
    }

    if (formik.values.jurisdictionCode === 'ca') {
      return (
        <Select
          {...formik.getFieldProps('regionCode')}
          label="Province of incorporation"
          placeholder="Select a province"
          options={formatGeographyCodes(CA_PROVINCE_CODES)}
          disabled={isLoading || isCompleted}
          errorMessage={formik.touched.regionCode ? formik.errors.regionCode : undefined}
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
          body="Please enter email address, legal entity name, country of incorporation and registration number."
        />

        <Fieldset>
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

          <TextInput
            {...formik.getFieldProps('businessName')}
            label="Legal entity name"
            placeholder="Enter entity name"
            disabled={isLoading || isCompleted}
            errorMessage={formik.touched.businessName ? formik.errors.businessName : undefined}
          />

          <Select
            {...formik.getFieldProps('jurisdictionCode')}
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
            errorMessage={formik.touched.jurisdictionCode ? formik.errors.jurisdictionCode : undefined}
          />
          {renderRegionCodeSelect()}

          <TextInput
            {...formik.getFieldProps('registrationNumber')}
            label="Registration number"
            placeholder="0000"
            disabled={isLoading || isCompleted}
            errorMessage={formik.touched.registrationNumber ? formik.errors.registrationNumber : undefined}
          />
        </Fieldset>
      </Content>

      <ActionBar>
        <Button onClick={() => previousStep()} disabled={isLoading} variant="secondary">
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
