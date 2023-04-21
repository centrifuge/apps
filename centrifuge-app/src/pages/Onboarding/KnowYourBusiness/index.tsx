import { useFormik } from 'formik'
import * as React from 'react'
import { useOnboarding } from '../../../components/OnboardingProvider'
import { EntityUser } from '../../../types'
import { KYB_COUNTRY_CODES } from '../geographyCodes'
import { useSetManualKybReference } from '../queries/useSetManualKybReference'
import { useVerifyBusiness } from '../queries/useVerifyBusiness'
import { BusinessInformation } from './BusinessInformation'
import { ManualBusinessVerification } from './ManualBusinessVerification'
import { validationSchema } from './validationSchema'

export function KnowYourBusiness() {
  const [activeKnowYourBusinessStep, setActiveKnowYourBusinessStep] = React.useState<number>(0)
  const nextKnowYourBusinessStep = () => setActiveKnowYourBusinessStep((current) => current + 1)
  const { onboardingUser, refetchOnboardingUser, nextStep } = useOnboarding<EntityUser>()
  const isUSOrCA =
    onboardingUser?.jurisdictionCode?.startsWith('us') || onboardingUser?.jurisdictionCode?.startsWith('ca')

  const { mutate: verifyBusiness, data: verifyBusinessData, isLoading, isError } = useVerifyBusiness()
  const { mutate: setManualKybReference } = useSetManualKybReference()

  const formik = useFormik({
    initialValues: {
      businessName: onboardingUser?.businessName || 'foo bar',
      email: onboardingUser?.email || 'ben@k-f.co',
      registrationNumber: onboardingUser?.registrationNumber || '22',
      jurisdictionCode:
        (isUSOrCA ? onboardingUser?.jurisdictionCode.slice(0, 2) : onboardingUser?.jurisdictionCode || 'ky') ?? '',
      regionCode: (isUSOrCA ? onboardingUser?.jurisdictionCode.split('_')[1] : '') ?? '',
    },
    onSubmit: async (values) => {
      const manualReview = !(values.jurisdictionCode in KYB_COUNTRY_CODES)
      await verifyBusiness({ ...values, manualReview })

      if (manualReview) {
        nextKnowYourBusinessStep()
      } else {
        nextStep()
      }
    },
    validationSchema,
  })

  const handleManualBusinessReview = (event: MessageEvent) => {
    if (event.origin === 'https://app.shuftipro.com' && event.data === 'manual.onboarding.completed') {
      setManualKybReference('123')
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
  }, [verifyBusinessData, refetchOnboardingUser])

  if (activeKnowYourBusinessStep === 0) {
    return <BusinessInformation formik={formik} isLoading={isLoading} isError={isError} />
  }

  if (activeKnowYourBusinessStep === 1) {
    return <ManualBusinessVerification verificationURL={verifyBusinessData?.verification_url} />
  }

  return null
}
