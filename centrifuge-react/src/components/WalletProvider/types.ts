import { Wallet, WalletAccount } from '@subwallet/wallet-connect/types'
import { EvmConnectorMeta } from './evm/connectors'

export type Account = WalletAccount

export type Proxy = { delegator: string; types: string[] }

export type EvmChainId = number

export type Network = 'centrifuge' | EvmChainId

export type State = {
  connectedType: 'evm' | 'substrate' | null
  walletDialog: {
    view: 'accounts' | 'wallets' | null
    network: 'centrifuge' | EvmChainId | null
    wallet: Wallet | EvmConnectorMeta | null
  }
  evm: {
    selectedWallet: EvmConnectorMeta | null
  }
  substrate: {
    accounts: Account[] | null
    selectedAccountAddress: string | null
    proxyAddress: string | null
    selectedWallet: Wallet | null
  }
}
