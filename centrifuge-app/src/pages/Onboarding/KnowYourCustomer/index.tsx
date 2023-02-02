import { useFormik } from 'formik'
import * as React from 'react'
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

// TODO: make dynamic based on the pool and tranche that the user is onboarding to
const trancheId = 'FAKETRANCHEID'
const poolId = 'FAKEPOOLID'

const authorizedSignerInput = object({
  name: string().required(),
  dateOfBirth: date().required().min(new Date(1900, 0, 1)).max(new Date()),
  countryOfCitizenship: string().required(),
  isAccurate: boolean().oneOf([true]),
})

export const KnowYourCustomer = ({ backStep, nextStep }: Props) => {
  const [activeKnowYourCustomerStep, setActiveKnowYourCustomerStep] = React.useState<number>(0)

  const nextKnowYourCustomerStep = () => setActiveKnowYourCustomerStep((current) => current + 1)

  const { onboardingUser, refetchOnboardingUser } = useOnboardingUser()
  const { authToken } = useAuth()

  const isCompleted = !!onboardingUser?.steps?.verifyIdentity.completed

  const formik = useFormik({
    initialValues: {
      name: onboardingUser.name || '',
      dateOfBirth: onboardingUser.dateOfBirth || '',
      countryOfCitizenship: onboardingUser.countryOfCitizenship || '',
      isAccurate: !!isCompleted,
    },
    onSubmit: () => {
      startKYC()
    },
    validationSchema: authorizedSignerInput,
    validateOnMount: true,
  })

  const {
    mutate: startKYC,
    data: startKYCData,
    isLoading: isStartKYCLoading,
  } = useMutation(async () => {
    const response = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/startKYC`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: formik.values.name,
        dateOfBirth: formik.values.dateOfBirth,
        countryOfCitizenship: formik.values.countryOfCitizenship,
        ...(onboardingUser.investorType === undefined && { poolId, trancheId }),
      }),
    })

    return response.json()
  })

  const { mutate: setVerifiedIdentity } = useMutation(
    async () => {
      const response = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/setVerifiedIdentity`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dryRun: true,
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

  const handleVerifiedIdentity = (event: MessageEvent) => {
    if (event.origin === 'https://app.shuftipro.com') {
      setVerifiedIdentity()
    }
  }

  React.useEffect(() => {
    window.addEventListener('message', handleVerifiedIdentity)

    return () => {
      window.removeEventListener('message', handleVerifiedIdentity)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    if (startKYCData?.verification_url) {
      nextKnowYourCustomerStep()
    }
  }, [startKYCData, refetchOnboardingUser])

  if (activeKnowYourCustomerStep === 0) {
    return (
      <AuthorizedSignerVerification
        nextStep={nextStep}
        backStep={backStep}
        formik={formik}
        isLoading={isStartKYCLoading}
        isCompleted={isCompleted}
      />
    )
  }

  if (activeKnowYourCustomerStep === 1) {
    return <IdentityVerification verificationURL={startKYCData.verification_url} />
  }

  return null
}
