import { isWeb3Injected } from '@polkadot/extension-dapp'
import { getWalletBySource, getWallets } from '@subwallet/wallet-connect/dotsama/wallets'
import { Wallet, WalletAccount } from '@subwallet/wallet-connect/types'
import * as React from 'react'
import { useQuery } from 'react-query'
import { firstValueFrom } from 'rxjs'
import { useCentrifuge } from '../CentrifugeProvider'

type Account = WalletAccount

type Proxy = { delegator: string; types: string[] }

type WalletContextType = {
  accounts: Account[] | null
  selectedAccount: Account | null
  isConnecting: boolean
  isWeb3Injected: boolean
  connect: (source?: string) => Promise<void>
  disconnect: () => void
  selectAccount: (address: string) => void
  selectedWallet: Wallet | null
  selectProxy: (address: string | null) => void
  proxy: Proxy | null
  proxies: Record<string, Proxy[]> | undefined
}

const WalletContext = React.createContext<WalletContextType>(null as any)

export const wallets = getWallets()

const PERSIST_KEY = 'centrifugeWalletPersist'
const PERSISTED_EXTENSION_KEY = 'centrifugeWalletPersistedExtension'
const PERSISTED_ADDRESS_KEY = 'centrifugeWalletPersistedAddress'
const PERSISTED_PROXY_KEY = 'centrifugeWalletPersistedProxy'

export function useWallet() {
  const ctx = React.useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within Provider')
  return ctx
}

export function useAddress() {
  const { selectedAccount, proxy } = useWallet()
  return proxy?.delegator || selectedAccount?.address
}

let triedEager = false

type WalletProviderProps = {
  children: React.ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [accounts, setAccounts] = React.useState<Account[] | null>(null)
  const [selectedAccountAddress, setSelectedAccountAddress] = React.useState<string | null>(null)
  const [proxyAddress, setProxyAddress] = React.useState<string | null>(null)
  const [isConnecting, setIsConnecting] = React.useState(false)
  const [selectedWallet, setSelectedWallet] = React.useState<Wallet | null>(null)
  const unsubscribeRef = React.useRef<(() => void) | null>()
  const cent = useCentrifuge()
  const { data: proxies } = useQuery(
    ['proxies', accounts?.map((acc) => acc.address)],
    () =>
      firstValueFrom(cent.proxies.getMultiUserProxies([accounts!.map((acc) => acc.address)])).then((proxies) => {
        return Object.fromEntries(
          Object.entries(proxies).map(([delegatee, ps]) => [
            cent.utils.formatAddress(delegatee),
            ps.map((p) => ({ ...p, delegator: cent.utils.formatAddress(p.delegator) })),
          ])
        )
      }),
    {
      enabled: !!accounts?.length,
      staleTime: Infinity,
    }
  )

  function setFilteredAccounts(accounts: Account[]) {
    const mappedAccounts = accounts.map((acc) => ({
      ...acc,
      address: cent.utils.formatAddress(acc.address),
    }))

    setAccounts(mappedAccounts)
    const persistedAddress = localStorage.getItem(PERSISTED_ADDRESS_KEY)
    const persistedProxy = localStorage.getItem(PERSISTED_PROXY_KEY)
    const matchingAccount = persistedAddress && mappedAccounts.find((acc) => acc.address === persistedAddress)?.address
    const address = matchingAccount || mappedAccounts[0]?.address
    setSelectedAccountAddress(address)
    if (matchingAccount && persistedProxy) {
      setProxyAddress(persistedProxy)
    }
    localStorage.setItem(PERSISTED_ADDRESS_KEY, address ?? '')
  }

  const disconnect = React.useCallback(async () => {
    setAccounts(null)
    setSelectedAccountAddress(null)
    setIsConnecting(false)
    setProxyAddress(null)
    setSelectedWallet(null)
    localStorage.removeItem(PERSIST_KEY)
    localStorage.removeItem(PERSISTED_EXTENSION_KEY)
    localStorage.removeItem(PERSISTED_ADDRESS_KEY)
    localStorage.removeItem(PERSISTED_PROXY_KEY)
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }
  }, [])

  const connect = React.useCallback(async (source?: string) => {
    unsubscribeRef.current?.()
    setIsConnecting(true)

    try {
      const wallet = source ? getWalletBySource(source) : wallets.find((w) => w.installed)
      if (!wallet?.installed) throw new Error('Wallet not available')
      setSelectedWallet(wallet)

      await wallet.enable()

      const unsub = await wallet.subscribeAccounts((allAccounts) => {
        if (!allAccounts) throw new Error('No accounts')
        setFilteredAccounts(allAccounts)
      })
      unsubscribeRef.current = unsub as any

      localStorage.setItem(PERSIST_KEY, '1')
      localStorage.setItem(PERSISTED_EXTENSION_KEY, wallet.extensionName)
    } catch (e) {
      console.error(e)
      localStorage.removeItem(PERSIST_KEY)
      localStorage.removeItem(PERSISTED_EXTENSION_KEY)
      localStorage.removeItem(PERSISTED_ADDRESS_KEY)
      localStorage.removeItem(PERSISTED_PROXY_KEY)
      throw e
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const selectAccount = React.useCallback((address: string) => {
    setSelectedAccountAddress(address)
    localStorage.setItem(PERSISTED_ADDRESS_KEY, address)
    setProxyAddress(null)
  }, [])

  const selectProxy = React.useCallback((address: string | null) => {
    setProxyAddress(address)
    localStorage.setItem(PERSISTED_PROXY_KEY, address ?? '')
  }, [])

  async function tryReconnect() {
    const source = localStorage.getItem(PERSISTED_EXTENSION_KEY)!
    // This script might have loaded quicker than the wallet extension,
    // so we'll wait up to 2 seconds for it to load
    let i = 8
    let hasWallet = false
    while (i--) {
      const wallet = getWalletBySource(source)
      if (wallet?.installed) {
        hasWallet = true
        break
      }
      await new Promise((res) => setTimeout(res, 250))
    }
    if (hasWallet) {
      connect(source)
    }
  }

  React.useEffect(() => {
    if (!triedEager && localStorage.getItem(PERSIST_KEY)) {
      tryReconnect()
    }
    triedEager = true

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [])

  const ctx: WalletContextType = React.useMemo(
    () => ({
      accounts,
      selectedAccount: accounts?.find((acc) => acc.address === selectedAccountAddress) ?? null,
      isConnecting,
      isWeb3Injected,
      connect,
      disconnect,
      selectedWallet,
      selectAccount,
      selectProxy,
      proxy:
        selectedAccountAddress && proxyAddress && proxies
          ? proxies[selectedAccountAddress]?.find((p) => p.delegator === proxyAddress) ?? null
          : null,
      proxies,
    }),
    [
      accounts,
      isConnecting,
      connect,
      disconnect,
      selectedWallet,
      selectAccount,
      selectProxy,
      selectedAccountAddress,
      proxyAddress,
      proxies,
    ]
  )

  return <WalletContext.Provider value={ctx}>{children}</WalletContext.Provider>
}
