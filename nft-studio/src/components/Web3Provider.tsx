import { isWeb3Injected, web3AccountsSubscribe, web3Enable, web3EnablePromise } from '@polkadot/extension-dapp'
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'
import * as React from 'react'
import { useCentrifugeQuery } from '../utils/useCentrifugeQuery'

const KUSAMA_GENESIS_HASH = '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe'

type Account = InjectedAccountWithMeta

type Proxy = { delegator: string; types: string[] }

type Web3ContextType = {
  accounts: Account[] | null
  selectedAccount: Account | null
  isConnecting: boolean
  isWeb3Injected: boolean
  connect: () => Promise<void>
  disconnect: () => void
  selectAccount: (address: string) => void
  selectProxy: (address: string | null) => void
  proxy: Proxy | null
  proxies: Proxy[] | undefined
}

const Web3Context = React.createContext<Web3ContextType>(null as any)

export function useWeb3() {
  const ctx = React.useContext(Web3Context)
  if (!ctx) throw new Error('useWeb3 must be used within Web3Provider')
  return ctx
}

let triedEager = false

export const Web3Provider: React.FC = ({ children }) => {
  const [accounts, setAccounts] = React.useState<Account[] | null>(null)
  const [selectedAccountAddress, setSelectedAccountAddress] = React.useState<string | null>(null)
  const [proxyAddress, setProxyAddress] = React.useState<string | null>(null)
  const [isConnecting, setIsConnecting] = React.useState(false)
  const unsubscribeRef = React.useRef<(() => void) | null>()
  const [proxies] = useCentrifugeQuery(
    ['proxies', selectedAccountAddress],
    (cent) => cent.proxies.getUserProxies([selectedAccountAddress!]),
    {
      enabled: !!selectedAccountAddress,
    }
  )

  function setFilteredAccounts(accounts: Account[]) {
    const kusamaAccounts = accounts.filter(
      (account) => !account.meta.genesisHash || account.meta.genesisHash === KUSAMA_GENESIS_HASH
    )

    setAccounts(kusamaAccounts)
    const persistedAddress = localStorage.getItem('web3PersistedAddress')
    const address =
      (persistedAddress && kusamaAccounts.find((acc) => acc.address === persistedAddress)?.address) ||
      kusamaAccounts[0]?.address
    setSelectedAccountAddress(address)
    localStorage.setItem('web3PersistedAddress', address ?? '')
  }

  const disconnect = React.useCallback(async () => {
    setAccounts(null)
    setSelectedAccountAddress(null)
    setIsConnecting(false)
    setProxyAddress(null)
    localStorage.setItem('web3Persist', '')
    localStorage.setItem('web3PersistedAddress', '')
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }
  }, [])

  const connect = React.useCallback(async () => {
    unsubscribeRef.current?.()
    setIsConnecting(true)

    try {
      const injected = await (web3EnablePromise || web3Enable('NFT Studio'))
      if (injected.length === 0) {
        // no extension installed, or the user did not accept the authorization
        // in this case we should inform the use and give a link to the extension
        throw new Error('No extension or not authorized')
      }

      const unsub = await web3AccountsSubscribe((allAccounts) => {
        setFilteredAccounts(allAccounts)
      })
      unsubscribeRef.current = unsub

      localStorage.setItem('web3Persist', '1')
    } catch (e) {
      console.error(e)
      localStorage.setItem('web3Persist', '')
      localStorage.setItem('web3PersistedAddress', '')
      throw e
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const selectAccount = React.useCallback((address: string) => {
    setSelectedAccountAddress(address)
    localStorage.setItem('web3PersistedAddress', address)
    setProxyAddress(null)
  }, [])

  React.useEffect(() => {
    if (!triedEager && localStorage.getItem('web3Persist')) {
      connect()
    }
    triedEager = true

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ctx: Web3ContextType = React.useMemo(
    () => ({
      accounts,
      selectedAccount: accounts?.find((acc) => acc.address === selectedAccountAddress) ?? null,
      isConnecting,
      isWeb3Injected,
      connect,
      disconnect,
      selectAccount,
      selectProxy: setProxyAddress,
      proxy: proxyAddress ? proxies?.find((p) => p.delegator === proxyAddress) ?? null : null,
      proxies,
    }),
    [accounts, isConnecting, connect, disconnect, selectAccount, selectedAccountAddress, proxyAddress, proxies]
  )

  return <Web3Context.Provider value={ctx}>{children}</Web3Context.Provider>
}
