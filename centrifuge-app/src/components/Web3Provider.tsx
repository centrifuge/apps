import { isWeb3Injected } from '@polkadot/extension-dapp'
import { getWalletBySource, getWallets, Wallet, WalletAccount } from '@talisman-connect/wallets'
import * as React from 'react'
import { useQuery } from 'react-query'
import { firstValueFrom } from 'rxjs'
import { config } from '../config'
import { useCentrifuge } from './CentrifugeProvider'

type Account = WalletAccount

type Proxy = { delegator: string; types: string[] }

type Web3ContextType = {
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

const Web3Context = React.createContext<Web3ContextType>(null as any)

export const wallets = getWallets()

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
  const [selectedWallet, setSelectedWallet] = React.useState<Wallet | null>(null)
  const unsubscribeRef = React.useRef<(() => void) | null>()
  const cent = useCentrifuge()
  const { data: proxies } = useQuery(
    ['proxies', accounts?.map((acc) => acc.address)],
    () => firstValueFrom(cent.proxies.getMultiUserProxies([accounts!.map((acc) => acc.address)])),
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
    const persistedAddress = localStorage.getItem('web3PersistedAddress')
    const persistedProxy = localStorage.getItem('web3PersistedProxy')
    const matchingAccount = persistedAddress && mappedAccounts.find((acc) => acc.address === persistedAddress)?.address
    const address = matchingAccount || mappedAccounts[0]?.address
    setSelectedAccountAddress(address)
    if (matchingAccount && persistedProxy) {
      setProxyAddress(persistedProxy)
    }
    localStorage.setItem('web3PersistedAddress', address ?? '')
  }

  const disconnect = React.useCallback(async () => {
    setAccounts(null)
    setSelectedAccountAddress(null)
    setIsConnecting(false)
    setProxyAddress(null)
    setSelectedWallet(null)
    localStorage.setItem('web3Persist', '')
    localStorage.setItem('web3PersistedWallet', '')
    localStorage.setItem('web3PersistedAddress', '')
    localStorage.setItem('web3PersistedProxy', '')
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

      await wallet.enable(config.name)

      const unsub = await wallet.subscribeAccounts((allAccounts) => {
        if (!allAccounts) throw new Error('No accounts')
        setFilteredAccounts(allAccounts)
      })
      unsubscribeRef.current = unsub as any

      localStorage.setItem('web3Persist', '1')
      localStorage.setItem('web3PersistedWallet', wallet.extensionName)
    } catch (e) {
      console.error(e)
      localStorage.setItem('web3Persist', '')
      localStorage.setItem('web3PersistedWallet', '')
      localStorage.setItem('web3PersistedAddress', '')
      localStorage.setItem('web3PersistedProxy', '')
      throw e
    } finally {
      setIsConnecting(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectAccount = React.useCallback((address: string) => {
    setSelectedAccountAddress(address)
    localStorage.setItem('web3PersistedAddress', address)
    setProxyAddress(null)
  }, [])

  const selectProxy = React.useCallback((address: string | null) => {
    setProxyAddress(address)
    localStorage.setItem('web3PersistedProxy', address ?? '')
  }, [])

  async function tryReconnect() {
    const source = localStorage.getItem('web3PersistedWallet')!
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
    if (!triedEager && localStorage.getItem('web3Persist')) {
      tryReconnect()
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

  return <Web3Context.Provider value={ctx}>{children}</Web3Context.Provider>
}
