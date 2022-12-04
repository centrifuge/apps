import { useQuery } from 'react-query'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { useWeb3 } from '../components/Web3Provider'

export const useAuth = (authorizedProxyTypes: string[]) => {
  const { selectedAccount, proxy } = useWeb3()
  const cent = useCentrifuge()

  const {
    data: isAuth,
    refetch: refetchAuth,
    isFetched: isAuthFetched,
  } = useQuery(
    proxy ? `authenticate-${selectedAccount?.address}-${proxy?.delegator}` : `authenticate-${selectedAccount?.address}`,
    async () => {
      if (selectedAccount?.address && cent.config.auth) {
        const { address } = selectedAccount

        return cent.config.auth(address, authorizedProxyTypes, proxy)
      }

      return false
    },
    {
      staleTime: 0,
      enabled: !!selectedAccount && !!cent.config.auth,
      retry: false,
    }
  )

  return {
    isAuth,
    refetchAuth,
    isAuthFetched,
  }
}
