import { useQuery } from 'react-query'
import { useLocation } from 'react-router-dom'
import { useOnboardingAuth } from '../../../components/OnboardingAuthProvider'

export const useVerifyEmail = () => {
  const { authToken } = useOnboardingAuth()
  const { search } = useLocation()
  const token = new URLSearchParams(search).get('token')

  const query = useQuery(
    ['verify-email'],
    async () => {
      const response = await fetch(`${import.meta.env.REACT_APP_ONBOARDING_API_URL}/verifyEmail?token=${token}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.status === 204) {
        return response
      }
      throw response.statusText
    },
    {
      retry: 1,
      refetchOnWindowFocus: false,
    }
  )

  return query
}
