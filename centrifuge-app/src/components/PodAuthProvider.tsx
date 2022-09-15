import * as React from 'react'
import { useQuery } from 'react-query'
import { useCentrifuge } from './CentrifugeProvider'
import { useWeb3 } from './Web3Provider'

const PodAuthContext = React.createContext<{
  tokens: Record<string, { signed: string; payload: any } | undefined>
  login: (address: string, onBehalfOf: string) => Promise<void>
}>(null as any)

function getPersisted() {
  try {
    return JSON.parse(sessionStorage.getItem('podAuth') ?? '')
  } catch {
    return {}
  }
}

export const PodAuthProvider: React.FC = ({ children }) => {
  const [tokens, setTokens] = React.useState<Record<string, { signed: string; payload: any } | undefined>>(getPersisted)
  const { selectedWallet } = useWeb3()
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
    async (address: string, onBehalfOf: string) => {
      // @ts-expect-error Signer type version mismatch
      const { payload, token } = await cent.pod.signToken([address, onBehalfOf, selectedWallet?.signer])
      setTokens((prev) => ({ ...prev, [`${address}-${onBehalfOf}`]: { signed: token, payload } }))
      console.log('token', token, payload)
    },
    [selectedWallet?.signer, cent]
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
  } = useQuery(['podAccount', podUrl, token], () => cent.pod.getSelf([podUrl!, token!.signed]), {
    enabled: !!podUrl && !!token,
    staleTime: Infinity,
    retry: 1,
    refetchOnMount: false,
  })

  async function login() {
    if (!address || !proxy?.delegator) return
    setIsSigning(true)
    try {
      await ctx.login(address, proxy.delegator)
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
    canLogIn: !!proxy?.delegator,
    isLoggingIn: isAccountLoading || isSigning,
    isLoggedIn: hasValidToken && !!account,
    loginError: error,
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
