import { useFormik } from 'formik'
import * as React from 'react'
import { boolean, date, object, string } from 'yup'
import { useOnboarding } from '../../../components/OnboardingProvider'
import { useStartKYC } from '../queries/useStartKYC'
import { useVerifyIdentity } from '../queries/useVerifyIdentity'
import { IdentityVerification } from './IdentityVerification'
import { SignerVerification } from './SignerVerification'

const signerInput = object({
  name: string().required(),
  dateOfBirth: date().required().min(new Date(1900, 0, 1)).max(new Date()),
  countryOfCitizenship: string().required(),
  countryOfResidence: string().required(),
  isAccurate: boolean().oneOf([true]),
})

export const KnowYourCustomer = () => {
  const [activeKnowYourCustomerStep, setActiveKnowYourCustomerStep] = React.useState<number>(0)

  const nextKnowYourCustomerStep = () => setActiveKnowYourCustomerStep((current) => current + 1)

  const { onboardingUser, refetchOnboardingUser } = useOnboarding()

  const isCompleted = !!onboardingUser?.steps?.verifyIdentity.completed

  const formik = useFormik({
    initialValues: {
      name: onboardingUser?.name || '',
      dateOfBirth: onboardingUser?.dateOfBirth || '',
      countryOfCitizenship: onboardingUser?.countryOfCitizenship || '',
      countryOfResidence: onboardingUser?.countryOfResidence || '',
      isAccurate: !!isCompleted,
    },
    onSubmit: (values) => {
      startKYC(values)
    },
    validationSchema: signerInput,
    validateOnMount: true,
  })

  const { mutate: startKYC, data: startKYCData, isLoading: isStartKYCLoading } = useStartKYC()

  const { mutate: setVerifiedIdentity } = useVerifyIdentity()

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
    return <SignerVerification formik={formik} isLoading={isStartKYCLoading} isCompleted={isCompleted} />
  }

  if (activeKnowYourCustomerStep === 1) {
    return <IdentityVerification verificationURL={startKYCData.verification_url} />
  }

  return null
}
