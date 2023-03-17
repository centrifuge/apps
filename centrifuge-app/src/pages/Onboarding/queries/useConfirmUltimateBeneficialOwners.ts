import { useMutation } from 'react-query'
import { useAuth } from '../../../components/AuthProvider'
import { useOnboarding } from '../../../components/OnboardingProvider'

type UltimateBeneficialOwner = {
  name: string
  dateOfBirth: string
}

export const useConfirmUltimateBeneficialOwners = () => {
  const { authToken } = useAuth()
  const { refetchOnboardingUser, nextStep } = useOnboarding()

  const mutation = useMutation(
    async (ultimateBeneficialOwners: UltimateBeneficialOwner[]) => {
      const response = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/confirmOwners`, {
        method: 'POST',
        body: JSON.stringify({
          ultimateBeneficialOwners,
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

      if (!json.globalSteps?.confirmOwners?.completed) {
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
