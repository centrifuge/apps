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
import { useFormik } from 'formik'
import * as React from 'react'
import { array, boolean, date, object, string } from 'yup'
import { ConfirmResendEmailVerificationDialog } from '../../components/Dialogs/ConfirmResendEmailVerificationDialog'
import { EditOnboardingEmailAddressDialog } from '../../components/Dialogs/EditOnboardingEmailAddressDialog'
import { ActionBar, Content, ContentHeader, Fieldset, Notification, NotificationBar } from '../../components/Onboarding'
import { useOnboarding } from '../../components/OnboardingProvider'
import { EntityUser } from '../../types'
import { formatGeographyCodes } from '../../utils/formatGeographyCodes'
import { RESIDENCY_COUNTRY_CODES } from './geographyCodes'
import { useConfirmOwners } from './queries/useConfirmOwners'

const businessOwnershipInput = object({
  ultimateBeneficialOwners: array().of(
    object({
      name: string().required(),
      dateOfBirth: date().required().min(new Date(1900, 0, 1)).max(new Date()),
      countryOfCitizenship: string().required(),
      countryOfResidency: string().required(),
    })
  ),
  isAccurate: boolean().oneOf([true]),
})

const EmailVerificationInlineFeedback = ({ email, completed }: { email: string; completed: boolean }) => {
  const [isEditOnboardingEmailAddressDialogOpen, setIsEditOnboardingEmailAddressDialogOpen] = React.useState(false)
  const [isConfirmResendEmailVerificationDialogOpen, setIsConfirmResendEmailVerificationDialogOpen] =
    React.useState(false)

  if (completed) {
    return <Notification>Email address verified</Notification>
  }

  return (
    <>
      <Notification type="alert">
        Please verify your email address. Email sent to {email}. If you did not receive any email{' '}
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
      support@centrifuge.io.
    </Notification>
  )
}

export const BusinessOwnership = () => {
  const { onboardingUser, refetchOnboardingUser, previousStep, nextStep } = useOnboarding<EntityUser>()

  const isCompleted = !!onboardingUser?.globalSteps.confirmOwners.completed
  const isEmailVerified = !!onboardingUser?.globalSteps.verifyEmail.completed

  const formik = useFormik({
    initialValues: {
      ultimateBeneficialOwners: onboardingUser?.ultimateBeneficialOwners.length
        ? onboardingUser?.ultimateBeneficialOwners.map((owner) => ({
            name: owner.name,
            dateOfBirth: owner.dateOfBirth,
            countryOfCitizenship: owner.countryOfCitizenship,
            countryOfResidency: owner.countryOfResidency,
          }))
        : [{ name: '', dateOfBirth: '', countryOfCitizenship: '', countryOfResidency: '' }],
      isAccurate: !!isCompleted,
    },
    onSubmit: (values) => {
      upsertBusinessOwnership(values.ultimateBeneficialOwners)
    },
    validationSchema: businessOwnershipInput,
    validateOnMount: true,
  })

  const { mutate: upsertBusinessOwnership, isLoading, isError } = useConfirmOwners()

  const onFocus = () => {
    refetchOnboardingUser()
  }

  React.useEffect(() => {
    if (isEmailVerified) {
      window.removeEventListener('focus', onFocus)
    } else {
      window.addEventListener('focus', onFocus)
    }

    return () => {
      window.removeEventListener('focus', onFocus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmailVerified])

  const removeOwner = (index: number) => {
    if (formik.values.ultimateBeneficialOwners.length === 1) {
      formik.setFormikState((state) => ({
        ...state,
        values: {
          ...state.values,
          ultimateBeneficialOwners: [
            {
              name: '',
              dateOfBirth: '',
              countryOfCitizenship: '',
              countryOfResidency: '',
            },
          ],
        },
      }))
    } else {
      const newOwners = formik.values.ultimateBeneficialOwners.filter((_, i) => i !== index)

      formik.setFormikState((state) => ({
        ...state,
        values: {
          ...state.values,
          ultimateBeneficialOwners: newOwners,
        },
      }))
    }
  }

  const addOwner = () => {
    formik.setFormikState((state) => ({
      ...state,
      values: {
        ...state.values,
        ultimateBeneficialOwners: [
          ...state.values.ultimateBeneficialOwners,
          {
            name: '',
            dateOfBirth: '',
            countryOfCitizenship: '',
            countryOfResidency: '',
          },
        ],
      },
    }))
  }

  return (
    <>
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

        {formik.values.ultimateBeneficialOwners.map((owner, index) => (
          <React.Fragment key={`${owner.name}${index}`}>
            <Fieldset>
              <Shelf justifyContent="space-between">
                <Text as="span" variant="interactive2">
                  Person {index + 1}
                </Text>

                {!isCompleted && formik.values.ultimateBeneficialOwners.length > 1 && (
                  <Button variant="secondary" onClick={() => removeOwner(index)} disabled={isLoading}>
                    <Shelf alignItems="center" gap="4px">
                      <IconTrash size={16} />
                    </Shelf>
                  </Button>
                )}
              </Shelf>

              <TextInput
                id={`ultimateBeneficialOwners[${index}].name`}
                value={owner.name}
                label="Full Name"
                onChange={formik.handleChange}
                disabled={isLoading || isCompleted}
              />

              <DateInput
                id={`ultimateBeneficialOwners[${index}].dateOfBirth`}
                value={owner.dateOfBirth}
                label="Date of Birth"
                onChange={formik.handleChange}
                disabled={isLoading || isCompleted}
              />

              <Select
                name="countryOfCitizenship"
                label="Country of Citizenship"
                placeholder="Select a country"
                options={formatGeographyCodes(RESIDENCY_COUNTRY_CODES)}
                onChange={(event) =>
                  formik.setFieldValue(`ultimateBeneficialOwners[${index}].countryOfCitizenship`, event.target.value)
                }
                value={formik.values.ultimateBeneficialOwners[index].countryOfCitizenship}
                disabled={isLoading || isCompleted}
              />

              <Select
                name="countryOfResidency"
                label="Country of Residency"
                placeholder="Select a country"
                options={formatGeographyCodes(RESIDENCY_COUNTRY_CODES)}
                onChange={(event) =>
                  formik.setFieldValue(`ultimateBeneficialOwners[${index}].countryOfResidency`, event.target.value)
                }
                value={formik.values.ultimateBeneficialOwners[index].countryOfResidency}
                disabled={isLoading || isCompleted}
              />
            </Fieldset>

            <Divider />
          </React.Fragment>
        ))}

        {formik.values.ultimateBeneficialOwners.length <= 2 && !isCompleted && (
          <Box>
            <Button variant="secondary" onClick={() => addOwner()} disabled={isLoading}>
              <Shelf alignItems="center" gap="4px">
                <IconPlus size={16} />
                <Text>Add Beneficial Owner</Text>
              </Shelf>
            </Button>
          </Box>
        )}

        <Box>
          <Checkbox
            id="isAccurate"
            disabled={isLoading || isCompleted}
            checked={formik.values.isAccurate}
            onChange={formik.handleChange}
            label={
              <Text style={{ cursor: 'pointer', paddingLeft: '6px' }}>
                I confim that all the information provided is true and accurate, and I have identified all the benefical
                owners with more than 25% ownership.
              </Text>
            }
          />
        </Box>
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
          disabled={isLoading || !formik.isValid || !isEmailVerified}
          loadingMessage="Confirming"
        >
          Next
        </Button>
      </ActionBar>
    </>
  )
}
