import { isWeb3Injected, web3Accounts, web3Enable } from '@polkadot/extension-dapp'
import { encodeAddress } from '@polkadot/util-crypto'
import * as React from 'react'

const KUSAMA_GENESIS_HASH = '0xb0a8d493285c2df73290dfb7e61f870f17b41801197a149ca93654499ea3dafe'

type Account = any

type Web3Context = {
  accounts: Account[] | null
  selectedAccount: Account | null
  isConnecting: boolean
  isWeb3Injected: boolean
  connect: () => Promise<void>
}

const Web3Context = React.createContext<Web3Context>(null as any)

export function useWeb3Context() {
  return React.useContext(Web3Context)
}

const truncateAddress = (address) => {
  const encodedAddress = encodeAddress(address, 2)
  console.log('encodedAddress', encodedAddress)
  const first8 = encodedAddress.slice(0, 8)
  const last3 = encodedAddress.slice(-3)

  return `${first8}...${last3}`
}

export const Web3Provider: React.FC = ({ children }) => {
  const [accounts, setAccounts] = React.useState<Account[] | null>(null)
  const [selectedAccount, setSelectedAccount] = React.useState<Account | null>(null)
  const [isConnecting, setIsConnecting] = React.useState(true)

  async function connect() {
    setIsConnecting(true)
    try {
      await web3Enable('NFT Studio')
      const allAccounts = await web3Accounts()

      const kusamaAccounts = allAccounts.filter(
        (account) =>
          account.meta.genesisHash === KUSAMA_GENESIS_HASH ||
          account.meta.genesisHash === '' ||
          account.meta.genesisHash === null
      )

      setAccounts(kusamaAccounts)
      setSelectedAccount(kusamaAccounts[0])
    } finally {
      setIsConnecting(false)
    }
  }

  const ctx: Web3Context = React.useMemo(
    () => ({
      accounts,
      selectedAccount,
      isConnecting,
      isWeb3Injected,
      connect,
    }),
    [accounts, selectedAccount, isConnecting]
  )

  return <Web3Context.Provider value={ctx}>{children}</Web3Context.Provider>
}
