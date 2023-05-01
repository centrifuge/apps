import { useFormik } from 'formik'
import * as React from 'react'
import { boolean, date, object, string } from 'yup'
import { useOnboarding } from '../../../components/OnboardingProvider'
import { useStartKYC } from '../queries/useStartKYC'
import { useVerifyIdentity } from '../queries/useVerifyIdentity'
import { IdentityVerification } from './IdentityVerification'
import { SignerVerification } from './SignerVerification'

const getValidationSchema = (investorType: 'individual' | 'entity') =>
  object({
    name: string().required('Please enter a name'),
    dateOfBirth: date()
      .required('Please enter a date of birth')
      .min(new Date(1900, 0, 1), 'Date of birth must be after 1900')
      .max(new Date(), 'Date of birth must be in the past'),
    countryOfCitizenship: string().required('Please select a country of citizenship'),
    countryOfResidency: string().required('Please select a country of residency'),
    isAccurate: boolean().oneOf([true], 'You must confirm that the information is accurate'),
    ...(investorType === 'individual' && {
      email: string().email('Please enter a valid email address').required('Please enter an email address'),
    }),
  })

export const KnowYourCustomer = () => {
  const [activeKnowYourCustomerStep, setActiveKnowYourCustomerStep] = React.useState<number>(0)

  const nextKnowYourCustomerStep = () => setActiveKnowYourCustomerStep((current) => current + 1)

  const { onboardingUser, refetchOnboardingUser } = useOnboarding()

  const investorType = onboardingUser?.investorType === 'entity' ? 'entity' : 'individual'

  const isCompleted = !!onboardingUser?.globalSteps?.verifyIdentity.completed

  const validationSchema = getValidationSchema(investorType)

  const formik = useFormik({
    initialValues: {
      name: onboardingUser?.name || '',
      dateOfBirth: onboardingUser?.dateOfBirth || '',
      countryOfCitizenship: onboardingUser?.countryOfCitizenship || '',
      countryOfResidency: onboardingUser?.countryOfResidency || '',
      isAccurate: !!isCompleted,
      email: investorType === 'individual' ? onboardingUser?.email || '' : undefined,
    },
    onSubmit: (values) => {
      startKYC(values)
    },
    validationSchema,
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
