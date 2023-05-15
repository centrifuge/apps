import { Box, Button, Select, TextInput } from '@centrifuge/fabric'
import { FormikProps } from 'formik'
import * as React from 'react'
import {
  ActionBar,
  AlertBusinessVerification,
  Content,
  ContentHeader,
  Fieldset,
  NotificationBar,
  ValidEmailTooltip,
} from '../../../components/Onboarding'
import { useOnboarding } from '../../../components/OnboardingProvider'
import { EntityUser } from '../../../types'
import { formatGeographyCodes } from '../../../utils/formatGeographyCodes'
import { CA_PROVINCE_CODES, RESIDENCY_COUNTRY_CODES, US_STATE_CODES } from '../geographyCodes'

type Props = {
  formik: FormikProps<{
    businessName: string
    email: string
    registrationNumber: string
    jurisdictionCode: string
    regionCode: string
  }>
  isLoading: boolean
  isError: boolean
}

export const BusinessInformation = ({ formik, isLoading, isError }: Props) => {
  const { onboardingUser, previousStep, nextStep } = useOnboarding<EntityUser>()
  const [errorClosed, setErrorClosed] = React.useState(false)

  const isCompleted = !!onboardingUser?.globalSteps?.verifyBusiness.completed
  const isPendingManualKybReview = onboardingUser?.manualKybStatus === 'review.pending'
  const fieldIsDisabled = isLoading || isCompleted || isPendingManualKybReview

  const renderRegionCodeSelect = () => {
    if (formik.values.jurisdictionCode === 'us') {
      return (
        <Select
          {...formik.getFieldProps('regionCode')}
          label="State of incorporation"
          placeholder="Select a state"
          options={formatGeographyCodes(US_STATE_CODES)}
          disabled={fieldIsDisabled}
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
          disabled={fieldIsDisabled}
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
              disabled={fieldIsDisabled}
              errorMessage={formik.touched.email ? formik.errors.email : undefined}
            />
            {!isCompleted && !isPendingManualKybReview && <ValidEmailTooltip />}
          </Box>

          <TextInput
            {...formik.getFieldProps('businessName')}
            label="Legal entity name"
            placeholder="Enter entity name"
            disabled={fieldIsDisabled}
            errorMessage={formik.touched.businessName ? formik.errors.businessName : undefined}
          />

          <Select
            {...formik.getFieldProps('jurisdictionCode')}
            label="Country of incorporation"
            placeholder="Select a country"
            options={formatGeographyCodes(RESIDENCY_COUNTRY_CODES)}
            disabled={fieldIsDisabled}
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
            disabled={fieldIsDisabled}
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
            isCompleted || isPendingManualKybReview ? nextStep() : formik.handleSubmit()
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
