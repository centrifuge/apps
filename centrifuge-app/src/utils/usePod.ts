import { useQuery } from 'react-query'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { useAuth } from '../components/PodAuthProvider'

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
