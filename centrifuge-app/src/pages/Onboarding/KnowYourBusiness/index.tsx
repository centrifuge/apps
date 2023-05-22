import { useFormik } from 'formik'
import * as React from 'react'
import { object, string } from 'yup'
import { useOnboarding } from '../../../components/OnboardingProvider'
import { EntityUser } from '../../../types'
import { useSendVerifyEmail } from '../queries/useSendVerifyEmail'
import { useVerifyBusiness } from '../queries/useVerifyBusiness'
import { BusinessInformation } from './BusinessInformation'
import { ManualBusinessVerification } from './ManualBusinessVerification'

export const validationSchema = object({
  email: string().email('Please enter a valid email address').required('Please enter an email address'),
  businessName: string().required('Please enter the business name'),
  registrationNumber: string().required('Please enter the business registration number'),
  jurisdictionCode: string().required('Please select the business country of incorporation'),
  regionCode: string().when('jurisdictionCode', {
    is: (jurisdictionCode: string) => jurisdictionCode === 'us' || jurisdictionCode === 'ca',
    then: string().required('Please select your region code'),
  }),
})

export function KnowYourBusiness() {
  const [activeKnowYourBusinessStep, setActiveKnowYourBusinessStep] = React.useState<number>(0)

  const nextKnowYourBusinessStep = () => setActiveKnowYourBusinessStep((current) => current + 1)

  const { onboardingUser, nextStep } = useOnboarding<EntityUser>()

  const isUSOrCA =
    onboardingUser?.jurisdictionCode?.startsWith('us') || onboardingUser?.jurisdictionCode?.startsWith('ca')

  const formik = useFormik({
    initialValues: {
      businessName: onboardingUser?.businessName || '',
      email: onboardingUser?.email || '',
      registrationNumber: onboardingUser?.registrationNumber || '',
      jurisdictionCode:
        (isUSOrCA ? onboardingUser?.jurisdictionCode.slice(0, 2) : onboardingUser?.jurisdictionCode) ?? '',
      regionCode: (isUSOrCA ? onboardingUser?.jurisdictionCode.split('_')[1] : '') ?? '',
    },
    onSubmit: (values) => {
      verifyBusiness(values)
    },
    validationSchema,
    validateOnMount: true,
    enableReinitialize: true,
  })

  const {
    mutate: verifyBusiness,
    data: verifyBusinessData,
    isLoading: isVerifyBusinessLoading,
    isError,
  } = useVerifyBusiness()

  const { mutate: sendVerifyEmail } = useSendVerifyEmail()

  const handleManualBusinessReview = (event: MessageEvent) => {
    if (event.data === 'manual.onboarding.completed') {
      sendVerifyEmail()
      nextStep()
    }
  }

  React.useEffect(() => {
    window.addEventListener('message', handleManualBusinessReview)

    return () => {
      window.removeEventListener('message', handleManualBusinessReview)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    if (verifyBusinessData?.verification_url) {
      nextKnowYourBusinessStep()
    }
  }, [verifyBusinessData])

  if (activeKnowYourBusinessStep === 0) {
    return <BusinessInformation formik={formik} isLoading={isVerifyBusinessLoading} isError={isError} />
  }

  if (activeKnowYourBusinessStep === 1) {
    return <ManualBusinessVerification verificationURL={verifyBusinessData?.verification_url} />
  }

  return null
}
