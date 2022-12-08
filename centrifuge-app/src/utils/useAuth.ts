import { useState } from 'react'
import { useMutation, useQuery } from 'react-query'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { useWeb3 } from '../components/Web3Provider'

export const useAuth = (authorizedProxyTypes?: string[]) => {
  const { selectedAccount, proxy, selectedWallet } = useWeb3()
  const [authToken, setAuthToken] = useState<string>('')
  const cent = useCentrifuge()

  const { mutate: login, isLoading: isLoggingIn } = useMutation(async () => {
    try {
      if (selectedAccount?.address && selectedWallet?.signer) {
        const { address } = selectedAccount

        if (proxy) {
          // @ts-expect-error Signer type version mismatch
          const { token } = await cent.auth.generateJw3t(address, selectedWallet?.signer, {
            onBehalfOf: proxy.delegator,
            proxyTypes: proxy.types,
          })

          if (token) {
            if (authorizedProxyTypes) {
              const { delegator, types } = proxy

              const isAuthorizedProxy = authorizedProxyTypes.some((proxyType) => types.includes(proxyType))

              if (isAuthorizedProxy) {
                sessionStorage.setItem(`centrifuge-auth-${address}-${delegator}`, JSON.stringify(token))
                refetchAuth()
              }
            }
          }
        } else {
          // @ts-expect-error Signer type version mismatch
          const { token } = await cent.auth.generateJw3t(address, selectedWallet?.signer)

          if (token) {
            sessionStorage.setItem(`centrifuge-auth-${address}`, JSON.stringify(token))
            refetchAuth()
          }
        }
      }
    } catch {}
  })

  const {
    data: isAuth,
    refetch: refetchAuth,
    isFetched: isAuthFetched,
    isFetching: isAuthFetching,
  } = useQuery(
    ['authenticate', selectedAccount?.address, proxy && proxy.delegator],
    async () => {
      if (selectedAccount?.address) {
        const { address } = selectedAccount

        const sessionStorageName = proxy?.delegator
          ? `centrifuge-auth-${address}-${proxy.delegator}`
          : `centrifuge-auth-${address}`

        const token = sessionStorage.getItem(sessionStorageName)

        if (token) {
          setAuthToken(token)
          const isAuthenticated = await cent.auth.authenticate(address, token)

          if (isAuthenticated) {
            if (proxy) {
              if (authorizedProxyTypes) {
                const isAuthorizedProxy = await cent.auth.authorizeProxy(proxy.types, authorizedProxyTypes)

                return isAuthorizedProxy
              }
            } else {
              return true
            }
          }
        }
      }

      return false
    },
    {
      staleTime: 0,
      enabled: !!selectedAccount,
      retry: false,
    }
  )

  return {
    login,
    authToken,
    isAuth,
    refetchAuth,
    isAuthFetched,
    isAuthFetching,
    isLoggingIn,
  }
}
