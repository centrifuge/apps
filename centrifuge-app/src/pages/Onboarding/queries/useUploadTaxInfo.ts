import { useMutation } from 'react-query'
import { useAuth } from '../../../components/AuthProvider'
import { useOnboarding } from '../../../components/OnboardingProvider'

export const useUploadTaxInfo = (taxInfo: File | null) => {
  const { authToken } = useAuth()
  const { pool, refetchOnboardingUser, nextStep } = useOnboarding()

  const mutation = useMutation(
    async () => {
      if (taxInfo) {
        const formData = new FormData()
        formData.append('taxInfo', taxInfo)

        const response = await fetch(
          `${import.meta.env.REACT_APP_ONBOARDING_API_URL}/uploadTaxInfo?poolId=${pool.id}&trancheId=${pool.trancheId}`,
          {
            method: 'POST',
            body: formData,
            headers: {
              Authorization: `Bearer ${authToken}`,
              'Content-Type': 'multipart/form-data',
            },
            credentials: 'include',
          }
        )

        if (response.status !== 200) {
          throw new Error()
        }

        const json = await response.json()

        if (!json.steps?.verifyTaxInfo?.completed) {
          throw new Error()
        }
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
