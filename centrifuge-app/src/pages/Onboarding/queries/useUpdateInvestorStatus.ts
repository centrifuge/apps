import { useQuery } from 'react-query'
import { useLocation } from 'react-router-dom'
import { useOnboardingAuth } from '../../../components/OnboardingAuthProvider'

export const useUpdateInvestorStatus = () => {
  const { authToken } = useOnboardingAuth()
  const { search } = useLocation()
  const token = new URLSearchParams(search).get('token')
  const status = new URLSearchParams(search).get('status')

  const query = useQuery(
    ['update-investor-status'],
    async () => {
      const response = await fetch(
        `${import.meta.env.REACT_APP_ONBOARDING_API_URL}/updateInvestorStatus?token=${token}&status=${status}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
          credentials: 'include',
        }
      )

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
