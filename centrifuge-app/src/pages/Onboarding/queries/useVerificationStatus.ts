import { useQuery } from 'react-query'
import { useOnboardingAuth } from '../../../components/OnboardingAuthProvider'
import { useOnboarding } from '../../../components/OnboardingProvider'

export const useVerificationStatus = (verificationType: 'kyb' | 'kyc') => {
  const { authToken } = useOnboardingAuth()
  const { refetchOnboardingUser } = useOnboarding()

  const mutation = useQuery(
    ['verificationStatus', authToken],
    async (): Promise<'request.pending' | 'verification.accepted'> => {
      const response = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/verificationStatus`, {
        method: 'POST',
        body: JSON.stringify({
          verificationType,
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

      console.log({ json })

      return json
    },
    {
      onSuccess: () => {
        refetchOnboardingUser()
      },
    }
  )

  return mutation
}
