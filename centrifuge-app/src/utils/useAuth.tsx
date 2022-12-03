import { useQuery } from 'react-query'
import Cookies from 'universal-cookie'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { useWeb3 } from '../components/Web3Provider'

const cookies = new Cookies()

const AUTHORIZED_ONBOARDING_PROXY_TYPES = ['Any', 'Invest', 'NonTransfer', 'NonProxy']

export const useAuth = () => {
  const { selectedAccount, proxy } = useWeb3()

  const cent = useCentrifuge()

  const {
    data: isAuth,
    refetch: refetchAuth,
    isFetched: isAuthFetched,
  } = useQuery(
    proxy ? `authenticate-${selectedAccount?.address}-${proxy?.delegator}` : `authenticate-${selectedAccount?.address}`,
    async () => {
      if (selectedAccount?.address) {
        const { address } = selectedAccount

        if (proxy) {
          const { delegator, types } = proxy

          const token = cookies.get(`centrifuge-auth-${address}-${delegator}`)

          if (token) {
            const payload = await cent.auth.verifyJw3t(token)

            if (payload) {
              const isAuthorizedProxy = AUTHORIZED_ONBOARDING_PROXY_TYPES.some((proxyType) => types.includes(proxyType))

              return isAuthorizedProxy
            }
          }
        } else {
          const token = cookies.get(`centrifuge-auth-${address}`)

          if (token) {
            const payload = await cent.auth.verifyJw3t(token)

            return payload.address === address
          }
        }
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
