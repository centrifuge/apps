import { useQuery } from 'react-query'
import { useOnboardingAuth } from '../../../components/OnboardingAuthProvider'
import { OnboardingUser } from '../../../types'

export const useVerificationStatus = (verificationType: 'kyb' | 'kyc', onboardingUser: OnboardingUser) => {
  const { authToken } = useOnboardingAuth()

  const query = useQuery(
    ['verificationStatus'],
    async () => {
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

      return json.verificationStatus
    },
    {
      enabled: !!onboardingUser,
      retry: 1,
    }
  )

  return query
}
