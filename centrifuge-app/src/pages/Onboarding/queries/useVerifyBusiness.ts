import { useMutation } from 'react-query'
import { useAuth } from '../../../components/AuthProvider'
import { useOnboarding } from '../../../components/OnboardingProvider'

type BusinessInformation = {
  email: string
  businessName: string
  registrationNumber: string
  jurisdictionCode: string
  regionCode: string
  incorporationDate: string
}

export const useVerifyBusiness = () => {
  const { authToken } = useAuth()
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
          incorporationDate: values.incorporationDate,
          trancheId: pool.trancheId,
          poolId: pool.id,
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
