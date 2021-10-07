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
  const [selectedAccount, setSelectedAccount] = React.useState<Account | null>(null)
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
      setSelectedAccount(kusamaAccounts[0])
    } catch (e) {
      localStorage.setItem('web3Persist', null)
    } finally {
      setIsConnecting(false)
    }
  }

  async function disconnect() {
    setAccounts(null)
    setSelectedAccount(null)
    setIsConnecting(false)
    localStorage.setItem('web3Persist', null)
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
      selectedAccount,
      isConnecting,
      isWeb3Injected,
      connect,
      disconnect,
    }),
    [accounts, selectedAccount, isConnecting]
  )

  return <Web3Context.Provider value={ctx}>{children}</Web3Context.Provider>
}
