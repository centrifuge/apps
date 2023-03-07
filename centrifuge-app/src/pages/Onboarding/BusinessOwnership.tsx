import {
  Box,
  Button,
  Checkbox,
  DateInput,
  Divider,
  IconPlus,
  IconTrash,
  Select,
  Shelf,
  Text,
  TextInput,
} from '@centrifuge/fabric'
import { Field, FieldArray, FieldProps, Form, Formik, useFormikContext } from 'formik'
import * as React from 'react'
import { array, boolean, date, object, string } from 'yup'
import { ConfirmResendEmailVerificationDialog } from '../../components/Dialogs/ConfirmResendEmailVerificationDialog'
import { EditOnboardingEmailAddressDialog } from '../../components/Dialogs/EditOnboardingEmailAddressDialog'
import { ActionBar, Content, ContentHeader, Fieldset, Notification, NotificationBar } from '../../components/Onboarding'
import { useOnboarding } from '../../components/OnboardingProvider'
import { ValidationToast } from '../../components/ValidationToast'
import { EntityUser } from '../../types'
import { formatGeographyCodes } from '../../utils/formatGeographyCodes'
import { RESIDENCY_COUNTRY_CODES } from './geographyCodes'
import { useConfirmOwners } from './queries/useConfirmOwners'

const validationSchema = object({
  ultimateBeneficialOwners: array(
    object({
      name: string().required('Please enter a name'),
      dateOfBirth: date()
        .required('Please enter a date of birth')
        .min(new Date(1900, 0, 1), 'Date of birth must be after 1900')
        .max(new Date(), 'Date of birth must be in the past'),
      countryOfCitizenship: string().required('Please select a country of citizenship'),
      countryOfResidency: string().required('Please select a country of residency'),
    }).required()
  )
    .min(1)
    .max(3),
  isAccurate: boolean().oneOf([true], 'You must confirm that the information is accurate'),
  isEmailVerified: boolean().oneOf([true], 'Please verify your email address'),
})

const EmailVerificationInlineFeedback = ({ email, completed }: { email: string; completed: boolean }) => {
  const { refetchOnboardingUser } = useOnboarding()

  const [isEditOnboardingEmailAddressDialogOpen, setIsEditOnboardingEmailAddressDialogOpen] = React.useState(false)
  const [isConfirmResendEmailVerificationDialogOpen, setIsConfirmResendEmailVerificationDialogOpen] =
    React.useState(false)

  const { setFieldValue } = useFormikContext()

  const onFocus = () => {
    refetchOnboardingUser()
  }

  React.useEffect(() => {
    if (completed) {
      setFieldValue('isEmailVerified', true)
      window.removeEventListener('focus', onFocus)
    } else {
      window.addEventListener('focus', onFocus)
    }

    return () => {
      window.removeEventListener('focus', onFocus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed, setFieldValue])

  if (completed) {
    return <Notification>Email address verified</Notification>
  }

  return (
    <>
      <Notification type="alert">
        Please verify your email address. Email sent to {email}. If you did not receive an email,{' '}
        <button onClick={() => setIsConfirmResendEmailVerificationDialogOpen(true)}>send again</button> or{' '}
        <button onClick={() => setIsEditOnboardingEmailAddressDialogOpen(true)}>edit email</button>. Otherwise contact{' '}
        <a href="mailto:support@centrifuge.io?subject=Onboarding email verification&body=I’m reaching out about…">
          support@centrifuge.io
        </a>
        .
      </Notification>

      <EditOnboardingEmailAddressDialog
        currentEmail={email}
        isDialogOpen={isEditOnboardingEmailAddressDialogOpen}
        setIsDialogOpen={setIsEditOnboardingEmailAddressDialogOpen}
      />

      <ConfirmResendEmailVerificationDialog
        isDialogOpen={isConfirmResendEmailVerificationDialogOpen}
        setIsDialogOpen={setIsConfirmResendEmailVerificationDialogOpen}
      />
    </>
  )
}

const BusinessOwnershipInlineFeedback = () => {
  return (
    <Notification type="alert">
      Unable to confirm business ownership or business ownership has already been confirmed. Please try again or contact
      <a href="mailto:support@centrifuge.io?subject=Onboarding confirm business ownership&body=I’m reaching out about…">
        support@centrifuge.io
      </a>
      .
    </Notification>
  )
}

export const BusinessOwnership = () => {
  const { onboardingUser, previousStep, nextStep } = useOnboarding<EntityUser>()

  const isCompleted = !!onboardingUser?.globalSteps.confirmOwners.completed
  const isEmailVerified = !!onboardingUser?.globalSteps.verifyEmail.completed

  const { mutate: upsertBusinessOwnership, isLoading, isError } = useConfirmOwners()

  return (
    <Formik
      initialValues={{
        ultimateBeneficialOwners: onboardingUser?.ultimateBeneficialOwners.length
          ? onboardingUser?.ultimateBeneficialOwners.map((owner) => ({
              name: owner.name,
              dateOfBirth: owner.dateOfBirth,
              countryOfCitizenship: owner.countryOfCitizenship,
              countryOfResidency: owner.countryOfResidency,
            }))
          : [{ name: '', dateOfBirth: '', countryOfCitizenship: '', countryOfResidency: '' }],
        isAccurate: isCompleted,
        isEmailVerified,
      }}
      onSubmit={(values) => {
        upsertBusinessOwnership(values.ultimateBeneficialOwners)
      }}
      validationSchema={validationSchema}
    >
      {({ values, resetForm, errors }) => (
        <Form noValidate>
          {errors.isEmailVerified && <ValidationToast label={errors.isEmailVerified} />}
          <Content>
            <NotificationBar>
              <EmailVerificationInlineFeedback email={onboardingUser?.email as string} completed={isEmailVerified} />
              {isError && <BusinessOwnershipInlineFeedback />}
            </NotificationBar>

            <ContentHeader
              title="Confirm business ownership"
              body="Add the names of any individuals who own or control more than than 25% of the company. If no person does,
        please add the largest shareholder."
            />

            <FieldArray
              name="ultimateBeneficialOwners"
              render={(arrayHelpers) => (
                <>
                  {values.ultimateBeneficialOwners.map((owner, index) => (
                    <React.Fragment key={index}>
                      <Fieldset>
                        <Shelf justifyContent="space-between">
                          <Text>Person {index + 1}</Text>
                          {!isCompleted && (
                            <Button
                              variant="secondary"
                              onClick={() => {
                                if (values.ultimateBeneficialOwners.length === 1) {
                                  arrayHelpers.replace(index, {
                                    name: '',
                                    dateOfBirth: '',
                                    countryOfCitizenship: '',
                                    countryOfResidency: '',
                                  })
                                  resetForm()
                                } else {
                                  arrayHelpers.remove(index)
                                }
                              }}
                              disabled={isLoading}
                            >
                              <Shelf alignItems="center" gap="4px">
                                <IconTrash size={16} />
                              </Shelf>
                            </Button>
                          )}
                        </Shelf>
                        <Field name={`ultimateBeneficialOwners.${index}.name`}>
                          {({ field, meta }: FieldProps) => (
                            <TextInput
                              {...field}
                              label="Full Name"
                              disabled={isLoading || isCompleted}
                              errorMessage={meta.touched ? meta.error : undefined}
                            />
                          )}
                        </Field>
                        <Field name={`ultimateBeneficialOwners.${index}.dateOfBirth`}>
                          {({ field, meta }: FieldProps) => (
                            <DateInput
                              {...field}
                              label="Date of Birth"
                              disabled={isLoading || isCompleted}
                              errorMessage={meta.touched ? meta.error : undefined}
                            />
                          )}
                        </Field>
                        <Field name={`ultimateBeneficialOwners.${index}.countryOfCitizenship`}>
                          {({ field, meta }: FieldProps) => (
                            <Select
                              {...field}
                              label="Country of Citizenship"
                              placeholder="Select a country"
                              options={formatGeographyCodes(RESIDENCY_COUNTRY_CODES)}
                              disabled={isLoading || isCompleted}
                              errorMessage={meta.touched ? meta.error : undefined}
                            />
                          )}
                        </Field>
                        <Field name={`ultimateBeneficialOwners.${index}.countryOfResidency`}>
                          {({ field, meta }: FieldProps) => (
                            <Select
                              {...field}
                              label="Country of Residency"
                              placeholder="Select a country"
                              options={formatGeographyCodes(RESIDENCY_COUNTRY_CODES)}
                              disabled={isLoading || isCompleted}
                              errorMessage={meta.touched ? meta.error : undefined}
                            />
                          )}
                        </Field>
                      </Fieldset>

                      <Divider />
                    </React.Fragment>
                  ))}
                  {values.ultimateBeneficialOwners.length <= 2 && !isCompleted && (
                    <Box>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          arrayHelpers.push({
                            name: '',
                            dateOfBirth: '',
                            countryOfCitizenship: '',
                            countryOfResidency: '',
                          })
                        }
                        disabled={isLoading}
                      >
                        <Shelf alignItems="center" gap="4px">
                          <IconPlus size={16} />
                          <Text>Add beneficial owner</Text>
                        </Shelf>
                      </Button>
                    </Box>
                  )}
                </>
              )}
            />

            <Box mb={4}>
              <Field name="isAccurate">
                {({ field, meta }: FieldProps) => (
                  <Checkbox
                    {...field}
                    disabled={isLoading || isCompleted}
                    checked={values.isAccurate}
                    label={
                      <Text style={{ cursor: 'pointer', paddingLeft: '6px' }}>
                        I confirm that all the information provided is true and accurate, and I have identified all the
                        beneficial owners with more than 25% ownership.
                      </Text>
                    }
                    errorMessage={meta.touched ? meta.error : undefined}
                  />
                )}
              </Field>
            </Box>
          </Content>

          <ActionBar>
            <Button onClick={() => previousStep()} disabled={isLoading} variant="secondary">
              Back
            </Button>
            {isCompleted ? (
              <Button onClick={() => nextStep()}>Next</Button>
            ) : (
              <Button loading={isLoading} disabled={isLoading} loadingMessage="Confirming" type="submit">
                Next
              </Button>
            )}
          </ActionBar>
        </Form>
      )}
    </Formik>
  )
}
