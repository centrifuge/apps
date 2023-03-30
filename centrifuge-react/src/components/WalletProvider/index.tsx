export { ConnectionGuard } from './ConnectionGuard'
export type { EvmChains } from './evm/chains'
export type { EvmConnectorMeta } from './evm/connectors'
export {
  createConnector,
  getStore,
  useConnectorState,
  useEvmProvider,
  useNativeBalance as useEvmNativeBalance,
  useNativeCurrency as useEvmNativeCurrency,
  useProviderForConnector,
} from './evm/utils'
export type {
  CombinedSubstrateAccount,
  ComputedMultisig,
  EvmChainId,
  Multisig,
  Network,
  Proxy,
  SubstrateAccount,
} from './types'
export { computeMultisig, getNetworkName, useGetExplorerUrl, useGetNetworkName, useNetworkName } from './utils'
export * from './WalletProvider'
