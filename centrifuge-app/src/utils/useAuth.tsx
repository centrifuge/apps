import axios from 'axios'
import { useQuery } from 'react-query'
import { useWeb3 } from '../components/Web3Provider'

export const useAuth = (authorizedProxyTypes: string[]) => {
  const { selectedAccount, proxy } = useWeb3()

  const {
    data: isAuth,
    refetch: refetchAuth,
    isFetched: isAuthFetched,
  } = useQuery(
    proxy ? `authenticate-${selectedAccount?.address}-${proxy?.delegator}` : `authenticate-${selectedAccount?.address}`,
    async () => {
      if (selectedAccount?.address) {
        const { address } = selectedAccount

        const response = await axios.get('/api/authenticateAndAuthorize.', {
          data: {
            address,
            authorizedProxyTypes,
            proxy,
          },
        })

        console.log('response', response)

        return response.data
      }

      return false
    },
    {
      staleTime: 0,
      enabled: !!selectedAccount,
    }
  )

  return {
    isAuth,
    refetchAuth,
    isAuthFetched,
  }
}
