import { useQuery } from 'react-query'
import { useOnboardingAuth } from '../../../components/OnboardingAuthProvider'

export const useVerificationStatus = (verificationType: 'kyb' | 'kyc') => {
  const { authToken } = useOnboardingAuth()

  const mutation = useQuery(
    ['verificationStatus'],
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
      enabled: !!authToken,
    }
  )

  return mutation
}
