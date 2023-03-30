import { Wallet, WalletAccount } from '@subwallet/wallet-connect/types'
import { EvmConnectorMeta } from './evm/connectors'

export type SubstrateAccount = WalletAccount

export type CombinedSubstrateAccount = {
  signingAccount: SubstrateAccount
  proxies?: Proxy[]
  multisig?: ComputedMultisig
  actingAddress: string
}

export type Proxy = { delegator: string; delegatee: string; types: string[] }

export type EvmChainId = number

export type Network = 'centrifuge' | number

export type Multisig = {
  signers: string[]
  threshold: number
}

export type ComputedMultisig = Multisig & { address: string }

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
    accounts: SubstrateAccount[] | null
    multisigs: ComputedMultisig[]
    selectedAccountAddress: string | null
    proxyAddresses: string[] | null
    multisigAddress: string | null
    selectedWallet: Wallet | null
  }
}
