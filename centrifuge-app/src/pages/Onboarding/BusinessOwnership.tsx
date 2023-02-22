import {
  Box,
  Button,
  Checkbox,
  DateInput,
  Divider,
  Flex,
  IconAlertCircle,
  IconCheckCircle,
  IconPlus,
  IconTrash,
  InlineFeedback,
  Select,
  Shelf,
  Stack,
  Text,
  TextInput,
} from '@centrifuge/fabric'
import { useFormik } from 'formik'
import * as React from 'react'
import styled from 'styled-components'
import { array, boolean, date, object, string } from 'yup'
import { ConfirmResendEmailVerificationDialog } from '../../components/Dialogs/ConfirmResendEmailVerificationDialog'
import { EditOnboardingEmailAddressDialog } from '../../components/Dialogs/EditOnboardingEmailAddressDialog'
import { useOnboarding } from '../../components/OnboardingProvider'
import { EntityUser } from '../../types'
import { formatGeographyCodes } from '../../utils/formatGeographyCodes'
import { RESIDENCY_COUNTRY_CODES } from './geographyCodes'
import { useConfirmOwners } from './queries/useConfirmOwners'
import { StyledInlineFeedback } from './StyledInlineFeedback'

const ClickableText = styled(Text)`
  color: #0000ee;

  &:hover {
    cursor: pointer;
  }

  &:active {
    color: #ff0000;
  }

  &:visited {
    color: #551a8b;
  }
`

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
    return (
      <StyledInlineFeedback>
        <Shelf gap={1}>
          <Flex>
            <IconCheckCircle size="16px" />
          </Flex>
          <Text fontSize="14px">Email address verified</Text>
        </Shelf>
      </StyledInlineFeedback>
    )
  }
  return (
    <StyledInlineFeedback>
      <Shelf gap={1}>
        <Box>
          <IconAlertCircle size="16px" />
        </Box>
        <Text fontSize="14px">
          Please verify your email address. Email sent to {email}. If you did not receive any email{' '}
          <ClickableText onClick={() => setIsConfirmResendEmailVerificationDialogOpen(true)}>send again</ClickableText>{' '}
          or <ClickableText onClick={() => setIsEditOnboardingEmailAddressDialogOpen(true)}>edit email</ClickableText>.
          Otherwise contact <a href="mailto:support@centrifuge.io">support@centrifuge.io</a>.
        </Text>
        <EditOnboardingEmailAddressDialog
          currentEmail={email}
          isDialogOpen={isEditOnboardingEmailAddressDialogOpen}
          setIsDialogOpen={setIsEditOnboardingEmailAddressDialogOpen}
        />
        <ConfirmResendEmailVerificationDialog
          isDialogOpen={isConfirmResendEmailVerificationDialogOpen}
          setIsDialogOpen={setIsConfirmResendEmailVerificationDialogOpen}
        />
      </Shelf>
    </StyledInlineFeedback>
  )
}

const BusinessOwnershipInlineFeedback = ({ isError }: { isError: boolean }) => {
  if (isError) {
    return (
      <StyledInlineFeedback>
        <InlineFeedback status="warning">
          <Text fontSize="14px">
            Unable to confirm business ownership or business ownership has already been confirmed. Please try again or
            contact support@centrifuge.io.
          </Text>
        </InlineFeedback>
      </StyledInlineFeedback>
    )
  }

  return null
}

export const BusinessOwnership = () => {
  const { onboardingUser, refetchOnboardingUser, previousStep, nextStep } = useOnboarding<EntityUser>()

  const isCompleted = !!onboardingUser?.steps.confirmOwners.completed
  const isEmailVerified = !!onboardingUser?.steps.verifyEmail.completed

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
    <Stack gap={4}>
      <Box>
        <EmailVerificationInlineFeedback email={onboardingUser?.email as string} completed={isEmailVerified} />
        <BusinessOwnershipInlineFeedback isError={isError} />
        <Text fontSize={5}>Confirm business ownership</Text>
        <Text fontSize={2}>
          Add the names of any individuals who own or control more than than 25% of the company. If no person does,
          please add the largest shareholder.
        </Text>
        <Stack gap={8} py={3} width="493px">
          {formik.values.ultimateBeneficialOwners.map((owner, index) => (
            <Stack gap={2}>
              <Shelf justifyContent="space-between">
                <Text>Person {index + 1}</Text>

                {!isCompleted && (
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
            </Stack>
          ))}
        </Stack>
        <Divider />
        {formik.values.ultimateBeneficialOwners.length <= 2 && !isCompleted && (
          <Box pt={3}>
            <Button variant="secondary" onClick={() => addOwner()} disabled={isLoading}>
              <Shelf alignItems="center" gap="4px">
                <IconPlus size={16} />
                <Text>Add Beneficial Owner</Text>
              </Shelf>
            </Button>
          </Box>
        )}
        <Box pt={5}>
          <Checkbox
            id="isAccurate"
            disabled={isLoading || isCompleted}
            style={{
              cursor: 'pointer',
            }}
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
      </Box>
      <Shelf gap={2}>
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
      </Shelf>
    </Stack>
  )
}
