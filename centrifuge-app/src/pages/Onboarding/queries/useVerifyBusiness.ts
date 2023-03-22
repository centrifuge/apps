import { useMutation } from 'react-query'
import { useOnboardingAuth } from '../../../components/OnboardingAuthProvider'
import { useOnboarding } from '../../../components/OnboardingProvider'

type BusinessInformation = {
  email: string
  businessName: string
  registrationNumber: string
  jurisdictionCode: string
  regionCode: string
}

export const useVerifyBusiness = () => {
  const { authToken } = useOnboardingAuth()
  const { refetchOnboardingUser, pool, nextStep } = useOnboarding()

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
          ...(pool && { poolId: pool.id, trancheId: pool.trancheId }),
          dryRun: true,
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

      if (!json.globalSteps?.verifyBusiness?.completed) {
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

  return mutation
}
