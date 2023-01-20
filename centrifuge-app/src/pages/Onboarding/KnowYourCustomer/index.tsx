import { useFormik } from 'formik'
import { useState } from 'react'
import { useMutation } from 'react-query'
import { boolean, date, object, string } from 'yup'
import { useAuth } from '../../../components/AuthProvider'
import { useOnboardingUser } from '../../../components/OnboardingUserProvider'
import { AuthorizedSignerVerification } from './AuthorizedSignerVerification'
import { IdentityVerification } from './IdentityVerification'

type Props = {
  nextStep: () => void
  backStep: () => void
}

const authorizedSignerInput = object({
  name: string().required(),
  dateOfBirth: date().required().min(new Date(1900, 0, 1)).max(new Date()),
  countryOfCitizenship: string().required(),
  isAccurate: boolean().oneOf([true]),
})

export const KnowYourCustomer = ({ backStep, nextStep }: Props) => {
  const [activeKnowYourCustomerStep, setActiveKnowYourCustomerStep] = useState<number>(0)

  const { onboardingUser, refetchOnboardingUser } = useOnboardingUser()
  const { authToken } = useAuth()

  // TODO: show a completion screen
  const isCompleted = onboardingUser?.steps?.verifyIdentity.completed

  const formik = useFormik({
    initialValues: {
      name: '',
      dateOfBirth: '',
      countryOfCitizenship: '',
      isAccurate: false,
    },
    onSubmit: () => {
      nextKnowYourCustomerStep()
    },
    validationSchema: authorizedSignerInput,
    validateOnMount: true,
  })

  const { mutate: verifyIdentity } = useMutation(
    async () => {
      const response = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/verifyIdentity`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formik.values.name,
          dateOfBirth: formik.values.dateOfBirth,
          countryOfCitizenship: formik.values.countryOfCitizenship,
        }),
      })

      return response.json()
    },
    {
      onSuccess: () => {
        refetchOnboardingUser()
        nextStep()
      },
    }
  )

  const nextKnowYourCustomerStep = () => setActiveKnowYourCustomerStep((current) => current + 1)

  if (activeKnowYourCustomerStep === 0) {
    return <AuthorizedSignerVerification backStep={backStep} formik={formik} />
  }

  if (activeKnowYourCustomerStep === 1) {
    return <IdentityVerification verifyIdentity={verifyIdentity} />
  }

  return null
}
