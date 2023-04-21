import { useMutation } from 'react-query'
import { useOnboardingAuth } from '../../../components/OnboardingAuthProvider'
import { useOnboarding } from '../../../components/OnboardingProvider'

export const useSetManualKybReference = () => {
  const { authToken } = useOnboardingAuth()
  const { refetchOnboardingUser, nextStep } = useOnboarding()

  const mutation = useMutation(
    async (manualKybReference: string) => {
      const response = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/setManualKybReference`, {
        method: 'POST',
        body: JSON.stringify({
          manualKybReference,
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

      if (json.manualKybReference !== manualKybReference) {
        throw new Error()
      }

      return json
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
