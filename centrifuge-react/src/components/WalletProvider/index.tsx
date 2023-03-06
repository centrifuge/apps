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
export { getNetworkName, useGetNetworkName, useNetworkName } from './utils'
export * from './WalletProvider'
