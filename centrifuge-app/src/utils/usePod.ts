import { useQuery } from 'react-query'
import { useAuth } from '../components/AuthProvider'
import { useCentrifuge } from '../components/CentrifugeProvider'

export function usePod(podUrl?: string | null) {
  const cent = useCentrifuge()
  const { authToken, login } = useAuth()

  const {
    error,
    isLoading: isPodLoading,
    isSuccess,
  } = useQuery(['podAccount', podUrl, authToken], () => cent.pod.getSelf([podUrl!, authToken]), {
    enabled: !!podUrl && !!authToken,
    staleTime: Infinity,
    retry: 1,
    refetchOnWindowFocus: false,
  })

  return { isLoggedIn: isSuccess, isPodLoading, login, loginError: error }
}
