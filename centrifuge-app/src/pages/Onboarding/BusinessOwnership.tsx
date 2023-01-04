import {
  Box,
  Button,
  Checkbox,
  DateInput,
  Flex,
  IconPlus,
  IconTrash,
  InlineFeedback,
  Shelf,
  Stack,
  Text,
  TextInput,
} from '@centrifuge/fabric'
import { useFormik } from 'formik'
import { useEffect, useState } from 'react'
import { useMutation } from 'react-query'
import { array, date, object, string } from 'yup'
import { useAuth } from '../../components/AuthProvider'
import { ultimateBeneficialOwner } from '../../types'
import { StyledInlineFeedback } from './StyledInlineFeedback'

type Props = {
  nextStep: () => void
  ultimateBeneficialOwners: ultimateBeneficialOwner[]
}

const businessOwnershipInput = object({
  ultimateBeneficialOwners: array().of(
    object({
      name: string().required(),
      dateOfBirth: date().required().min(new Date(1900, 0, 1)).max(new Date()),
    })
  ),
})

const BusinessOwnershipInlineFeedback = ({ isError, isSuccess }: { isError: boolean; isSuccess: boolean }) => {
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

  if (isSuccess) {
    return (
      <StyledInlineFeedback>
        <InlineFeedback status="ok">
          <Text fontSize="14px">Business ownership confirmed.</Text>
        </InlineFeedback>
      </StyledInlineFeedback>
    )
  }

  return null
}

export const BusinessOwnership = ({ nextStep, ultimateBeneficialOwners }: Props) => {
  const { authToken } = useAuth()
  const [isAccurate, setIsAccurate] = useState(false)

  const formik = useFormik({
    initialValues: {
      ultimateBeneficialOwners: ultimateBeneficialOwners.length
        ? ultimateBeneficialOwners.map((owner) => ({
            name: owner.name,
            dateOfBirth: '',
          }))
        : [{ name: '', dateOfBirth: '' }],
    },
    onSubmit: () => {
      upsertBusinessOwnership()
    },
    validationSchema: businessOwnershipInput,
  })

  const {
    mutate: upsertBusinessOwnership,
    isLoading,
    isSuccess,
    isError,
  } = useMutation(async () => {
    const response = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/businessVerificationConfirm`, {
      method: 'POST',
      body: JSON.stringify({ ultimateBeneficialOwners: formik.values.ultimateBeneficialOwners }),
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (response.status !== 201) {
      throw new Error()
    }
  })

  useEffect(() => {
    formik.validateForm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.ultimateBeneficialOwners])

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
        <BusinessOwnershipInlineFeedback isError={isError} isSuccess={isSuccess} />
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
                disabled={isLoading || isSuccess}
              />
              <DateInput
                id={`ultimateBeneficialOwners[${index}].dateOfBirth`}
                value={owner.dateOfBirth}
                label="Date of Birth*"
                onChange={formik.handleChange}
                disabled={isLoading || isSuccess}
              />
              <Button variant="secondary" onClick={() => removeOwner(index)}>
                <Flex>
                  <IconTrash size="20px" />
                </Flex>
              </Button>
            </Shelf>
          ))}
          {formik.values.ultimateBeneficialOwners.length <= 2 && (
            <Button variant="secondary" onClick={() => addOwner()}>
              <Flex>
                <IconPlus />
              </Flex>
            </Button>
          )}
        </Stack>
        <Box>
          <Checkbox
            disabled={isLoading || isSuccess}
            style={{
              cursor: 'pointer',
            }}
            checked={isAccurate}
            onChange={() => setIsAccurate((current) => !current)}
            label="I confim that all the information provided is true and accurate, and I have identified all the benefical owners with more than 25% ownership."
          />
        </Box>
      </Box>

      <Box>
        {isSuccess ? (
          <Button variant="primary" onClick={nextStep}>
            Next
          </Button>
        ) : (
          <Button
            onClick={formik.submitForm}
            loading={isLoading}
            disabled={isLoading || !isAccurate || !formik.isValid}
            loadingMessage="Confirming"
          >
            Confirm
          </Button>
        )}
      </Box>
    </Stack>
  )
}
