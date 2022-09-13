import { Keyring } from '@polkadot/keyring'
import { u8aToHex } from '@polkadot/util'
import { decodeAddress } from '@polkadot/util-crypto'
import * as jw3t from 'jw3t'
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
      const header = {
        algorithm: 'sr25519',
        token_type: 'JW3T',
        address_type: 'ss58',
      }
      const now = Math.floor(Date.now() / 1000)
      const payload = {
        address: u8aToHex(decodeAddress(address)),
        on_behalf_of: u8aToHex(decodeAddress(onBehalfOf)),
        proxy_type: 'any',
        proxy_type: 'pod_auth',
        expires_at: String(now + 60 * 60 * 24),
        issued_at: String(now),
        not_before: String(now),
      }
      const content = new jw3t.JW3TContent(header, payload)

      const keyring = new Keyring({ type: 'sr25519' })
      const account = keyring.addFromAddress(address)

      const polkaJsSigner = new jw3t.PolkaJsSigner({
        account,
        signer: selectedWallet?.signer as any,
      })
      const signer = new jw3t.JW3TSigner(polkaJsSigner, content)
      const { base64Content, base64Sig } = await signer.getSignature()
      const token = `${base64Content}.${base64Sig}`
      setTokens((prev) => ({ ...prev, [`${address}-${onBehalfOf}`]: { signed: token, payload } }))
    },
    [selectedWallet?.signer]
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
    retry: false,
    refetchOnWindowFocus: false,
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
