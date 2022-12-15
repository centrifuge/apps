import React from 'react'
import { useMutation, useQuery } from 'react-query'
import { useCentrifuge } from './CentrifugeProvider'
import { useWeb3 } from './Web3Provider'

export const AuthContext = React.createContext<{
  session?: { signed: string; payload: any } | null
  login: (authorizedProxyTypes: string[]) => void
  isLoggingIn: boolean
}>(null as any)

export const AuthProvider: React.FC = ({ children }) => {
  const { selectedWallet, proxy, selectedAccount } = useWeb3()
  const cent = useCentrifuge()

  const { data: session, refetch: refetchSession } = useQuery(
    ['session', selectedAccount?.address, proxy?.delegator],
    async () => {
      if (selectedAccount?.address) {
        if (proxy) {
          const rawItem = sessionStorage.getItem(`centrifuge-auth-${selectedAccount.address}-${proxy.delegator}`)
          if (rawItem) {
            return JSON.parse(rawItem)
          }
        } else {
          const rawItem = sessionStorage.getItem(`centrifuge-auth-${selectedAccount.address}`)
          if (rawItem) {
            return JSON.parse(rawItem)
          }
        }
      }
    },
    { enabled: !!selectedAccount?.address }
  )

  const { mutate: login, isLoading: isLoggingIn } = useMutation(async (authorizedProxyTypes: string[]) => {
    try {
      if (selectedAccount?.address && selectedWallet?.signer) {
        const { address } = selectedAccount

        if (proxy && authorizedProxyTypes) {
          // @ts-expect-error Signer type version mismatch
          const { token, payload } = await cent.auth.generateJw3t(address, selectedWallet?.signer, {
            onBehalfOf: proxy.delegator,
          })

          if (token) {
            const isAuthorizedProxy = await cent.auth.verifyProxy(address, proxy.delegator, authorizedProxyTypes)

            if (isAuthorizedProxy) {
              sessionStorage.setItem(
                `centrifuge-auth-${selectedAccount.address}-${proxy.delegator}`,
                JSON.stringify({ signed: token, payload })
              )
              refetchSession()
            }
          }
        } else {
          // @ts-expect-error Signer type version mismatch
          const { token, payload } = await cent.auth.generateJw3t(address, selectedWallet?.signer)

          if (token) {
            sessionStorage.setItem(
              `centrifuge-auth-${selectedAccount.address}`,
              JSON.stringify({ signed: token, payload })
            )
            refetchSession()
          }
        }
      }
    } catch {}
  })

  const ctx = React.useMemo(
    () => ({
      session,
      login,
      isLoggingIn,
    }),
    [session, login, isLoggingIn]
  )

  return <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>
}

export function useAuth(authorizedProxyTypes?: string[]) {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  const { selectedAccount } = useWeb3()

  const cent = useCentrifuge()

  const { session } = ctx

  const authToken = session?.signed ? session.signed : ''

  const { refetch: refetchAuth, data } = useQuery(
    ['authToken', authToken, authorizedProxyTypes],
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
    authToken,
    isAuth: data?.verified,
    login: ctx.login,
    refetchAuth,
  }
}
