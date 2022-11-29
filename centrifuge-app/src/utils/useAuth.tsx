import { useQuery } from 'react-query'
import Cookies from 'universal-cookie'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { useWeb3 } from '../components/Web3Provider'

const cookies = new Cookies()

export const useAuth = () => {
  const { selectedAccount } = useWeb3()

  const cent = useCentrifuge()

  const {
    data: isAuth,
    refetch: refetchAuth,
    isFetched: isAuthFetched,
  } = useQuery(
    `authenticate-${selectedAccount?.address}`,
    async () => {
      const token = cookies.get(`centrifuge-auth-${selectedAccount?.address}`)

      const payload = await cent.auth.verifyJw3t(token)
      if (payload?.address === selectedAccount?.address) {
        return true
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
