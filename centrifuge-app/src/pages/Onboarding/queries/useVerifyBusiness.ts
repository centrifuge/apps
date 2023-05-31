import { useMutation } from 'react-query'
import { useLocation } from 'react-router-dom'
import { useOnboardingAuth } from '../../../components/OnboardingAuthProvider'
import { useOnboarding } from '../../../components/OnboardingProvider'

type BusinessInformation = {
  email: string
  businessName: string
  registrationNumber: string
  jurisdictionCode: string
  regionCode: string
  manualReview?: boolean
}

export const useVerifyBusiness = () => {
  const { authToken } = useOnboardingAuth()
  const { refetchOnboardingUser, nextStep } = useOnboarding()
  const { search } = useLocation()

  const poolId = new URLSearchParams(search).get('poolId')
  const trancheId = new URLSearchParams(search).get('trancheId')

  const mutation = useMutation(
    async (values: BusinessInformation) => {
      const response = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/verifyBusiness`, {
        method: 'POST',
        body: JSON.stringify({
          email: values.email,
          businessName: values.businessName,
          registrationNumber: values.registrationNumber,
          jurisdictionCode:
            values.jurisdictionCode === 'us' || values.jurisdictionCode === 'ca'
              ? `${values.jurisdictionCode}_${values.regionCode}`
              : values.jurisdictionCode,
          dryRun: import.meta.env.REACT_APP_ONBOARDING_API_URL.includes('production') ? false : true,
          ...(values?.manualReview && poolId && trancheId && { poolId, trancheId }),
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

      const user = await response.json()

      if (values.manualReview && !user.manualKybReference) {
        throw new Error()
      }

      if (!values.manualReview && !user.globalSteps?.verifyBusiness?.completed) {
        throw new Error()
      }

      return user
    },
    {
      onSuccess: (_, values) => {
        refetchOnboardingUser()
        if (!values.manualReview) {
          nextStep()
        }
      },
    }
  )

  return mutation
}
