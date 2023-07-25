export { ConnectionGuard } from './ConnectionGuard'
export type { EvmChains } from './evm/chains'
export {
  useEvmProvider,
  useNativeBalance as useEvmNativeBalance,
  useNativeCurrency as useEvmNativeCurrency,
} from './evm/utils'
export type { ConnectorMeta } from './multichain/connectors'
export { createConnector, getStore, useConnectorState, useProviderForConnector } from './multichain/utils'
export type { CombinedSubstrateAccount, EvmChainId, Network, Proxy, SubstrateAccount } from './types'
export { getNetworkName, useGetExplorerUrl, useGetNetworkName, useNetworkName } from './utils'
export * from './WalletProvider'
