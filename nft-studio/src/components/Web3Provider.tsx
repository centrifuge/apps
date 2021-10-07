import { isWeb3Injected, web3Accounts, web3Enable } from '@polkadot/extension-dapp'
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
  selectAccount: (index: number) => void
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

  async function connect() {
    setIsConnecting(true)
    try {
      await web3Enable('NFT Studio')
      const allAccounts = await web3Accounts()

      localStorage.setItem('web3Persist', '1')

      const kusamaAccounts = allAccounts.filter(
        (account) =>
          account.meta.genesisHash === KUSAMA_GENESIS_HASH ||
          account.meta.genesisHash === '' ||
          account.meta.genesisHash === null
      )

      setAccounts(kusamaAccounts)
      const persistedAddress = localStorage.getItem('web3PersistedAddress')
      const address =
        (persistedAddress && kusamaAccounts.find((acc) => acc.address === persistedAddress)?.address) ||
        kusamaAccounts[0]?.address
      setSelectedAccountAddress(address)
    } catch (e) {
      localStorage.setItem('web3Persist', null)
      localStorage.setItem('web3PersistedAddress', null)
    } finally {
      setIsConnecting(false)
    }
  }

  async function disconnect() {
    setAccounts(null)
    setSelectedAccountAddress(null)
    setIsConnecting(false)
    localStorage.setItem('web3Persist', null)
    localStorage.setItem('web3PersistedAddress', null)
  }

  function selectAccount(index: number) {
    if (!accounts[index]) return
    setSelectedAccountAddress(accounts[index].address)
    localStorage.setItem('web3PersistedAddress', accounts[index].address)
  }

  React.useEffect(() => {
    if (!triedEager && localStorage.getItem('web3Persist')) {
      triedEager = true
      connect()
    }
  }, [])

  const ctx: Web3ContextType = React.useMemo(
    () => ({
      accounts,
      selectedAccount: accounts?.find((acc) => acc.address === selectedAccountAddress),
      isConnecting,
      isWeb3Injected,
      connect,
      disconnect,
      selectAccount,
    }),
    [accounts, selectedAccountAddress, isConnecting]
  )

  return <Web3Context.Provider value={ctx}>{children}</Web3Context.Provider>
}
