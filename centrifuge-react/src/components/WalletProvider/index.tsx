export { ConnectionGuard } from './ConnectionGuard'
export * from './evm/chains'
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
export type { CombinedSubstrateAccount, EvmChainId, Network, Proxy, SubstrateAccount } from './types'
export { getNetworkName, useGetExplorerUrl, useGetNetworkName, useNetworkName } from './utils'
export * from './WalletProvider'
