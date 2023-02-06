import { useCentrifuge, useWallet } from '@centrifuge/centrifuge-react'
import * as React from 'react'
import { useMutation, useQuery } from 'react-query'

const AUTHORIZED_POD_PROXY_TYPES = ['Any', 'PodAuth', 'PodAdmin']

export const PodAuthContext = React.createContext<{
  session?: { signed: string; payload: any } | null
  login: () => void
  isLoggingIn: boolean
}>(null as any)

export function PodAuthProvider({ children }: { children?: React.ReactNode }) {
  const { selectedWallet, proxy, selectedAccount } = useWallet()
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

  const { mutate: login, isLoading: isLoggingIn } = useMutation(async () => {
    try {
      if (selectedAccount?.address && selectedWallet?.signer) {
        const { address } = selectedAccount

        if (proxy) {
          const proxyType = proxy?.types.includes('Any')
            ? 'Any'
            : proxy?.types.includes('PodAuth')
            ? 'PodAuth'
            : 'PodAdmin'

          // @ts-expect-error Signer type version mismatch
          const { token, payload } = await cent.auth.generateJw3t(address, selectedWallet?.signer, {
            onBehalfOf: proxy.delegator,
            proxyType,
          })

          if (token) {
            const isAuthorizedProxy = await cent.auth.verifyProxy(address, proxy.delegator, AUTHORIZED_POD_PROXY_TYPES)

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

  return <PodAuthContext.Provider value={ctx}>{children}</PodAuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(PodAuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  const { selectedAccount } = useWallet()

  const cent = useCentrifuge()

  const { session } = ctx

  const authToken = session?.signed ? session.signed : ''

  const { refetch: refetchAuth, data } = useQuery(
    ['authToken', authToken],
    async () => {
      try {
        const { verified, payload } = await cent.auth.verify(authToken!)

        const onBehalfOf = payload.on_behalf_of
        const address = payload.address

        if (verified) {
          if (payload.on_behalf_of) {
            const isVerifiedProxy = await cent.auth.verifyProxy(address, onBehalfOf, AUTHORIZED_POD_PROXY_TYPES)

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
