import { useFormik } from 'formik'
import * as React from 'react'
import { useOnboarding } from '../../../components/OnboardingProvider'
import { EntityUser } from '../../../types'
import { KYB_COUNTRY_CODES } from '../geographyCodes'
import { useStartKYB } from '../queries/useStartKYB'
import { useVerifyBusiness } from '../queries/useVerifyBusiness'
import { BusinessInformation } from './BusinessInformation'
import { IdentityVerification } from './IdentityVerification'
import { validationSchema } from './validationSchema'

export function KnowYourBusiness() {
  const [activeKnowYourBusinessStep, setActiveKnowYourBusinessStep] = React.useState<number>(0)
  const nextKnowYourBusinessStep = () => setActiveKnowYourBusinessStep((current) => current + 1)
  const { onboardingUser, refetchOnboardingUser } = useOnboarding<EntityUser>()
  const isUSOrCA =
    onboardingUser?.jurisdictionCode?.startsWith('us') || onboardingUser?.jurisdictionCode?.startsWith('ca')

  const { mutate: verifyBusinessInformation, isLoading, isError } = useVerifyBusiness()
  const { mutate: startKYB, data: startKYBData, isLoading: isStartKYBLoading } = useStartKYB()

  const formik = useFormik({
    initialValues: {
      businessName: onboardingUser?.businessName || '',
      email: onboardingUser?.email || '',
      registrationNumber: onboardingUser?.registrationNumber || '',
      jurisdictionCode:
        (isUSOrCA ? onboardingUser?.jurisdictionCode.slice(0, 2) : onboardingUser?.jurisdictionCode || '') ?? '',
      regionCode: (isUSOrCA ? onboardingUser?.jurisdictionCode.split('_')[1] : '') ?? '',
    },
    onSubmit: (values) => {
      if (!(values.jurisdictionCode in KYB_COUNTRY_CODES)) {
        startKYB(values)
        // nextKnowYourBusinessStep()
      } else {
        // verifyBusinessInformation(values)
      }
    },
    validationSchema,
  })

  const handleVerifiedIdentity = (event: MessageEvent) => {
    console.log('event ==========', event.origin)
    if (event.origin === 'https://app.shuftipro.com') {
      console.log('event from shufti iframe', event)
      // setVerifiedIdentity()
    }
  }

  React.useEffect(() => {
    console.log('EventListener added')
    window.addEventListener('message', handleVerifiedIdentity)

    return () => {
      console.log('EventListener removed')
      window.removeEventListener('message', handleVerifiedIdentity)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    if (startKYBData?.verification_url) {
      nextKnowYourBusinessStep()
    }
  }, [startKYBData, refetchOnboardingUser])

  if (activeKnowYourBusinessStep === 0) {
    return <BusinessInformation formik={formik} isLoading={isLoading} isError={isError} />
  }

  if (activeKnowYourBusinessStep === 1) {
    return <IdentityVerification verificationURL={startKYBData!.verification_url} />
  }

  return null
}
