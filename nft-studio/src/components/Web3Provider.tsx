import {
  isWeb3Injected,
  web3Accounts,
  web3AccountsSubscribe,
  web3Enable,
  web3EnablePromise,
} from '@polkadot/extension-dapp'
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'
import * as React from 'react'

const KUSAMA_GENESIS_HASH = '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe'

type Account = InjectedAccountWithMeta

type Web3ContextType = {
  accounts: Account[] | null
  selectedAccount: Account | null
  isConnecting: boolean
  isWeb3Injected: boolean
  connect: () => Promise<void>
  disconnect: () => void
  selectAccount: (address: string) => void
}

const Web3Context = React.createContext<Web3ContextType>(null as any)

export function useWeb3Context() {
  const ctx = React.useContext(Web3Context)
  if (!ctx) throw new Error('useWeb3Context must be used within Web3Provider')
  return ctx
}

let triedEager = false

export const Web3Provider: React.FC = ({ children }) => {
  const [accounts, setAccounts] = React.useState<Account[] | null>(null)
  const [selectedAccountAddress, setSelectedAccountAddress] = React.useState<string | null>(null)
  const [isConnecting, setIsConnecting] = React.useState(true)
  const unsubscribeRef = React.useRef<(() => void) | null>()

  function setFilteredAccounts(accounts: Account[]) {
    const kusamaAccounts = accounts.filter(
      (account) =>
        account.meta.genesisHash === KUSAMA_GENESIS_HASH ||
        account.meta.genesisHash === '' ||
        account.meta.genesisHash == null
    )

    setAccounts(kusamaAccounts)
    const persistedAddress = localStorage.getItem('web3PersistedAddress')
    const address =
      (persistedAddress && kusamaAccounts.find((acc) => acc.address === persistedAddress)?.address) ||
      kusamaAccounts[0]?.address
    setSelectedAccountAddress(address)
    localStorage.setItem('web3PersistedAddress', address ?? '')
  }

  const connect = React.useCallback(async () => {
    setIsConnecting(true)
    try {
      const injected = await (web3EnablePromise || web3Enable('NFT Studio'))
      console.log('injected', injected)
      const allAccounts = await web3Accounts()

      setFilteredAccounts(allAccounts)

      localStorage.setItem('web3Persist', '1')
    } catch (e) {
      localStorage.setItem('web3Persist', '')
      localStorage.setItem('web3PersistedAddress', '')
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnect = React.useCallback(async () => {
    setAccounts(null)
    setSelectedAccountAddress(null)
    setIsConnecting(false)
    localStorage.setItem('web3Persist', '')
    localStorage.setItem('web3PersistedAddress', '')
  }, [])

  const connectAndListen = React.useCallback(async () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }
    await connect()
    const unsub = await web3AccountsSubscribe((allAccounts) => {
      if (!allAccounts) disconnect()
      setFilteredAccounts(allAccounts)
    })
    unsubscribeRef.current = unsub
  }, [connect, disconnect])

  const selectAccount = React.useCallback(async (address: string) => {
    setSelectedAccountAddress(address)
    localStorage.setItem('web3PersistedAddress', address)
  }, [])

  React.useEffect(() => {
    if (!triedEager && localStorage.getItem('web3Persist')) {
      triedEager = true
      connectAndListen()
    }
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
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
      connect: connectAndListen,
      disconnect,
      selectAccount,
    }),
    [accounts, isConnecting, connectAndListen, disconnect, selectAccount, selectedAccountAddress]
  )

  return <Web3Context.Provider value={ctx}>{children}</Web3Context.Provider>
}
