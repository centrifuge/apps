import React, { useEffect } from 'react'
import { useMutation, useQuery } from 'react-query'
import { useCentrifuge } from './CentrifugeProvider'
import { useWeb3 } from './Web3Provider'

export const AuthContext = React.createContext<{
  token?: { signed: string; payload: any } | null
  login: (authorizedProxyTypes: string[]) => void
  isLoggingIn: boolean
}>(null as any)

export const AuthProvider: React.FC = ({ children }) => {
  const { selectedWallet, proxy, selectedAccount } = useWeb3()
  const [token, setToken] = React.useState<{ signed: string; payload: any } | null>()

  useEffect(() => {
    if (selectedAccount?.address)
      if (proxy) {
        const rawItem = sessionStorage.getItem(`centrifuge-auth-${selectedAccount.address}-${proxy.delegator}`)
        setToken(rawItem ? JSON.parse(rawItem) : null)
      } else {
        const rawItem = sessionStorage.getItem(`centrifuge-auth-${selectedAccount.address}`)
        setToken(rawItem ? JSON.parse(rawItem) : null)
      }
    else {
      setToken(null)
    }
  }, [proxy, selectedAccount?.address])

  const cent = useCentrifuge()

  React.useEffect(() => {
    if (selectedAccount?.address && token) {
      if (proxy) {
        sessionStorage.setItem(`centrifuge-auth-${selectedAccount.address}-${proxy.delegator}`, JSON.stringify(token))
      } else {
        sessionStorage.setItem(`centrifuge-auth-${selectedAccount.address}`, JSON.stringify(token))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const { mutate: login, isLoading: isLoggingIn } = useMutation(async (authorizedProxyTypes: string[]) => {
    try {
      if (selectedAccount?.address && selectedWallet?.signer) {
        const { address } = selectedAccount

        if (proxy && authorizedProxyTypes) {
          // @ts-expect-error Signer type version mismatch
          const { token, payload } = await cent.auth.generateJw3t(address, selectedWallet?.signer, {
            onBehalfOf: proxy.delegator,
            proxyTypes: proxy.types,
          })

          if (token) {
            const isAuthorizedProxy = await cent.auth.verifyProxy(address, proxy.delegator, authorizedProxyTypes)

            if (isAuthorizedProxy) {
              setToken({ signed: token, payload })
            }
          }
        } else {
          // @ts-expect-error Signer type version mismatch
          const { token, payload } = await cent.auth.generateJw3t(address, selectedWallet?.signer)

          if (token) {
            setToken({ signed: token, payload })
          }
        }
      }
    } catch {}
  })

  const ctx = React.useMemo(
    () => ({
      token,
      login,
      isLoggingIn,
    }),
    [token, login, isLoggingIn]
  )

  return <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>
}

export function usePodAuth(podUrl?: string | null) {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  const { selectedAccount } = useWeb3()

  const authToken = React.useMemo(() => ctx.token, [ctx.token])
  const cent = useCentrifuge()

  const {
    data: account,
    isLoading: isAccountLoading,
    error,
    isSuccess,
  } = useQuery(['podAccount', podUrl, authToken], () => cent.pod.getSelf([podUrl!, authToken!.signed]), {
    enabled: !!podUrl && !!authToken?.signed,
    staleTime: Infinity,
    retry: 1,
    refetchOnWindowFocus: false,
  })

  return {
    authToken,
    login: ctx.login,
    account,
    isAccountLoading,
    error,
    isLoggedIn: isSuccess,
    isLoggingIn: isAccountLoading,
    canLogIn: !!selectedAccount?.address,
    loginError: error,
  }
}

export function useAuth(authorizedProxyTypes?: string[]) {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  const { selectedAccount, proxy } = useWeb3()

  const cent = useCentrifuge()

  const authToken = React.useMemo(() => {
    if (ctx.token?.signed) {
      if (proxy) {
        return ctx.token.signed
      }
      return ctx.token.signed
    }

    return ''
  }, [proxy, ctx.token])

  const {
    refetch: refetchAuth,
    isFetched: isAuthFetched,
    data,
    isLoading: isAccountLoading,
    error,
  } = useQuery(
    ['authToken', authToken],
    async () => {
      try {
        const { verified, payload } = await cent.auth.verify(authToken!)

        const onBehalfOf = payload.on_behalf_of
        const address = payload.address

        if (verified) {
          if (payload.on_behalf_of && authorizedProxyTypes) {
            const isVerifiedProxy = await cent.auth.verifyProxy(address, onBehalfOf, authorizedProxyTypes)

            if (isVerifiedProxy.verified) {
              return {
                verified: true,
                payload,
              }
            }
          } else {
            return {
              verified: true,
              payload,
            }
          }
        }

        return {
          verified: false,
        }
      } catch {
        return {
          verified: false,
        }
      }
    },
    {
      enabled: !!selectedAccount && !!authToken,
      staleTime: Infinity,
      retry: 1,
    }
  )

  return {
    refetchAuth,
    isAuthFetched,
    isAuth: data?.verified,
    authToken,
    login: ctx.login,
    isLoggingIn: ctx.isLoggingIn,
    isAccountLoading,
    account: data?.payload,
    error,
  }
}
