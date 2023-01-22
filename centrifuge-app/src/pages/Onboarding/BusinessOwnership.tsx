import {
  Box,
  Button,
  Checkbox,
  DateInput,
  Flex,
  IconAlertCircle,
  IconCheckCircle,
  IconPlus,
  IconTrash,
  InlineFeedback,
  Shelf,
  Stack,
  Text,
  TextInput,
} from '@centrifuge/fabric'
import { useFormik } from 'formik'
import * as React from 'react'
import { useMutation } from 'react-query'
import styled from 'styled-components'
import { array, boolean, date, object, string } from 'yup'
import { useAuth } from '../../components/AuthProvider'
import { ConfirmResendEmailVerificationDialog } from '../../components/Dialogs/ConfirmResendEmailVerificationDialog'
import { EditOnboardingEmailAddressDialog } from '../../components/Dialogs/EditOnboardingEmailAddressDialog'
import { useOnboardingUser } from '../../components/OnboardingUserProvider'
import { EntityUser } from '../../types'
import { StyledInlineFeedback } from './StyledInlineFeedback'

type Props = {
  nextStep: () => void
  backStep: () => void
}

// TODO: make dynamic based on the pool and tranche that the user is onboarding to
const trancheId = 'FAKETRANCHEID'
const poolId = 'FAKEPOOLID'

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
          isEditOnboardingEmailAddressDialogOpen={isEditOnboardingEmailAddressDialogOpen}
          setIsEditOnboardingEmailAddressDialogOpen={setIsEditOnboardingEmailAddressDialogOpen}
        />
        <ConfirmResendEmailVerificationDialog
          isConfirmResendEmailVerificationDialogOpen={isConfirmResendEmailVerificationDialogOpen}
          setIsConfirmResendEmailVerificationDialogOpen={setIsConfirmResendEmailVerificationDialogOpen}
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

export const BusinessOwnership = ({ backStep, nextStep }: Props) => {
  const { authToken } = useAuth()
  const { onboardingUser, refetchOnboardingUser } = useOnboardingUser() as {
    onboardingUser: EntityUser
    refetchOnboardingUser: () => void
  }

  const isCompleted = !!onboardingUser?.steps?.confirmOwners.completed
  const isEmailVerified = !!onboardingUser?.steps?.verifyEmail.completed

  const formik = useFormik({
    initialValues: {
      ultimateBeneficialOwners: onboardingUser?.ultimateBeneficialOwners?.length
        ? onboardingUser.ultimateBeneficialOwners.map((owner) => ({
            name: owner.name,
            dateOfBirth: owner.dateOfBirth,
          }))
        : [{ name: '', dateOfBirth: '' }],
      isAccurate: !!isCompleted,
    },
    onSubmit: () => {
      upsertBusinessOwnership()
    },
    validationSchema: businessOwnershipInput,
    validateOnMount: true,
  })

  const {
    mutate: upsertBusinessOwnership,
    isLoading,
    isError,
  } = useMutation(
    async () => {
      const response = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/confirmOwners`, {
        method: 'POST',
        body: JSON.stringify({
          ultimateBeneficialOwners: formik.values.ultimateBeneficialOwners,
          poolId,
          trancheId,
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

      if (!json.steps?.confirmOwners?.completed) {
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
          },
        ],
      },
    }))
  }

  return (
    <Stack gap={4}>
      <Box>
        <EmailVerificationInlineFeedback
          email={onboardingUser.email}
          completed={onboardingUser.steps.verifyEmail.completed}
        />
        <BusinessOwnershipInlineFeedback isError={isError} />
        <Text fontSize={5}>Confirm business ownership</Text>
        <Text fontSize={2}>
          Add the names of any individuals who own or control more than than 25% of the company. If no person does,
          please add the largest shareholder.
        </Text>
        <Stack gap={2} py={6} width="493px">
          {formik.values.ultimateBeneficialOwners.map((owner, index) => (
            <Shelf key={index} gap="20px">
              <TextInput
                id={`ultimateBeneficialOwners[${index}].name`}
                value={owner.name}
                label="Name*"
                onChange={formik.handleChange}
                disabled={isLoading || isCompleted}
              />
              <DateInput
                id={`ultimateBeneficialOwners[${index}].dateOfBirth`}
                value={owner.dateOfBirth}
                label="Date of Birth*"
                onChange={formik.handleChange}
                disabled={isLoading || isCompleted}
              />
              <Button variant="secondary" onClick={() => removeOwner(index)} disabled={isLoading || isCompleted}>
                <Flex>
                  <IconTrash size="20px" />
                </Flex>
              </Button>
            </Shelf>
          ))}
          {formik.values.ultimateBeneficialOwners.length <= 2 && (
            <Button variant="secondary" onClick={() => addOwner()} disabled={isLoading || isCompleted}>
              <Flex>
                <IconPlus />
              </Flex>
            </Button>
          )}
        </Stack>
        <Box>
          <Checkbox
            id="isAccurate"
            disabled={isLoading || isCompleted}
            style={{
              cursor: 'pointer',
            }}
            checked={formik.values.isAccurate}
            onChange={formik.handleChange}
            label="I confim that all the information provided is true and accurate, and I have identified all the benefical owners with more than 25% ownership."
          />
        </Box>
      </Box>
      <Shelf gap={2}>
        <Button onClick={() => backStep()} disabled={isLoading} variant="secondary">
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
