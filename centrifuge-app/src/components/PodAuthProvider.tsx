import * as React from 'react'
import { useQuery } from 'react-query'
import { useCentrifuge } from './CentrifugeProvider'
import { useWeb3 } from './Web3Provider'

const PodAuthContext = React.createContext<{
  tokens: Record<string, { signed: string; payload: any } | undefined>
  login: (address: string) => Promise<void>
}>(null as any)

const AUTHORIZED_POD_PROXY_TYPES = ['Any', 'PodAuth', 'NodeAdmin']

function getPersisted() {
  try {
    return JSON.parse(sessionStorage.getItem('podAuth') ?? '')
  } catch {
    return {}
  }
}

export const PodAuthProvider: React.FC = ({ children }) => {
  const [tokens, setTokens] = React.useState<Record<string, { signed: string; payload: any } | undefined>>(getPersisted)
  const { selectedWallet, proxy } = useWeb3()
  const cent = useCentrifuge()

  React.useEffect(() => {
    sessionStorage.setItem('podAuth', JSON.stringify(tokens))
  }, [tokens])

  React.useEffect(() => {
    function handleStorage(e: StorageEvent) {
      setTokens((prev) => {
        try {
          if (e.key === 'podAuth') {
            return JSON.parse(e.newValue ?? '{}')
          }
          return prev
        } catch {
          return prev
        }
      })
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const login = React.useCallback(
    async (address: string) => {
      // @ts-expect-error Signer type version mismatch
      const { payload, token } = await cent.auth.generateJw3t(address, selectedWallet?.signer)

      if (proxy) {
        const { delegator, types } = proxy

        const isAuthorizedProxy = AUTHORIZED_POD_PROXY_TYPES.some((proxyType) => types.includes(proxyType))

        if (isAuthorizedProxy) {
          setTokens((prev) => ({ ...prev, [`${address}-${delegator}`]: { signed: token, payload } }))
        }
      } else {
        setTokens((prev) => ({ ...prev, [address]: { signed: token, payload } }))
      }
    },
    [selectedWallet?.signer, cent, proxy]
  )

  const ctx = React.useMemo(
    () => ({
      tokens,
      login,
    }),
    [tokens, login]
  )

  return <PodAuthContext.Provider value={ctx}>{children}</PodAuthContext.Provider>
}

export function usePodAuth(podUrl?: string | null | undefined) {
  const ctx = React.useContext(PodAuthContext)
  if (!ctx) throw new Error('usePodAuth must be used within PodAuthProvider')
  const { selectedAccount, proxy } = useWeb3()
  const address = selectedAccount?.address
  const token = ctx.tokens[`${address}-${proxy?.delegator}`]
  const expiry = Number(token?.payload?.expires_at ?? 0) * 1000
  const hasValidToken = expiry > Date.now()
  const cent = useCentrifuge()
  const [isSigning, setIsSigning] = React.useState(false)

  const {
    data: account,
    isLoading: isAccountLoading,
    error,
  } = useQuery(['podAccount', podUrl, token, hasValidToken], () => cent.pod.getSelf([podUrl!, token!.signed]), {
    enabled: !!podUrl && !!token && hasValidToken,
    staleTime: Infinity,
    retry: 1,
    refetchOnWindowFocus: false,
  })

  async function login() {
    if (!address) return
    setIsSigning(true)
    try {
      await ctx.login(address)
    } finally {
      setIsSigning(false)
    }
  }

  React.useEffect(() => {
    setIsSigning(false)
  }, [address, proxy?.delegator])

  return {
    tokens: ctx.tokens,
    token: hasValidToken ? token : null,
    login,
    canLogIn: !!address,
    isLoggingIn: isAccountLoading || isSigning,
    isLoggedIn: hasValidToken && !!account,
    loginError: hasValidToken ? error : null,
  }
}

export function usePodDocument(podUrl: string | null | undefined, documentId: string | undefined) {
  const { token } = usePodAuth(podUrl)
  const cent = useCentrifuge()

  const query = useQuery(
    ['podDocument', podUrl, documentId, token],
    () => cent.pod.getCommittedDocument([podUrl!, token!.signed, documentId!]),
    {
      enabled: !!podUrl && !!documentId && !!token,
    }
  )

  return query
}
