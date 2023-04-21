import { useMutation } from 'react-query'
import { useLocation } from 'react-router'
import { useOnboardingAuth } from '../../../components/OnboardingAuthProvider'
import { useOnboarding } from '../../../components/OnboardingProvider'
import { Indentity, KYBResponse } from '../KnowYourBusiness/declarations'

export const useStartKYB = () => {
  const { authToken } = useOnboardingAuth()
  const { refetchOnboardingUser } = useOnboarding()

  let { search } = useLocation()
  const params = new URLSearchParams(search)
  let poolId = params.get('poolId')
  let trancheId = params.get('trancheId')

  const mutation = useMutation(
    async (values: Indentity) => {
      const response = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/startKYB`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: values.email,
          jurisdictionCode: values.jurisdictionCode,
          ...(poolId && { poolId }),
          ...(trancheId && { trancheId }),
        }),
      })

      const json: KYBResponse = await response.json()
      return json
    },
    {
      onSuccess: () => {
        console.log('onSuccess callback in "useStartKYB"')
        refetchOnboardingUser()
      },
    }
  )

  return mutation
}
