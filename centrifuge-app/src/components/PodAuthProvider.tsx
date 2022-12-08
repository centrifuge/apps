import { useQuery } from 'react-query'
import { useAuth } from '../utils/useAuth'
import { useCentrifuge } from './CentrifugeProvider'
import { useWeb3 } from './Web3Provider'

const AUTHORIZED_POD_PROXY_TYPES = ['Any', 'PodAuth', 'NodeAdmin']

export function usePodAuth(podUrl?: string | null | undefined) {
  const { selectedAccount, selectedWallet } = useWeb3()
  const { isAuth, isAuthFetched, authToken, login, isLoggingIn } = useAuth(AUTHORIZED_POD_PROXY_TYPES)
  const cent = useCentrifuge()

  const {
    data: account,
    isLoading: isAccountLoading,
    error,
  } = useQuery(['podAccount', podUrl, authToken], () => cent.pod.getSelf([podUrl!, authToken]), {
    enabled: !!podUrl && isAuthFetched && isAuth,
    staleTime: Infinity,
    retry: 1,
    refetchOnWindowFocus: false,
  })

  return {
    login,
    canLogIn: !!selectedAccount?.address && !!selectedWallet?.signer,
    isLoggingIn: isAccountLoading || isLoggingIn,
    isLoggedIn: isAuth && !!account,
    loginError: isAuthFetched && !isAuth ? error : null,
  }
}

export function usePodDocument(podUrl: string | null | undefined, documentId: string | undefined) {
  const cent = useCentrifuge()
  const { authToken, isAuth, isAuthFetched } = useAuth(AUTHORIZED_POD_PROXY_TYPES)

  const query = useQuery(
    ['podDocument', podUrl, documentId, authToken],
    () => cent.pod.getCommittedDocument([podUrl!, authToken, documentId!]),
    {
      enabled: !!podUrl && !!documentId && isAuthFetched && isAuth,
    }
  )
  return query
}
