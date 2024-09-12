import * as React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { CentrifugeProvider, CentrifugeProviderProps } from '../CentrifugeProvider'
import { TransactionProvider, TransactionToasts, TransactionToastsProps } from '../Transactions'
import { EvmChains, EvmConnectorMeta, WalletProvider } from '../WalletProvider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
    },
  },
})

export type ProviderProps = {
  children: React.ReactNode
  centrifugeConfig?: CentrifugeProviderProps['config']
  evmChains?: EvmChains
  evmAdditionalConnectors?: EvmConnectorMeta[]
  walletConnectId?: string
  subscanUrl?: string
  transactionToastPositionProps?: TransactionToastsProps['positionProps']
  infuraApiKey?: string
  alchemyApiKey?: string
  tenderlyApiKey?: string
}

export function Provider({
  children,
  centrifugeConfig,
  evmChains,
  evmAdditionalConnectors,
  walletConnectId,
  subscanUrl,
  transactionToastPositionProps,
  infuraApiKey,
  alchemyApiKey,
  tenderlyApiKey,
}: ProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <CentrifugeProvider config={centrifugeConfig}>
        <WalletProvider
          evmChains={evmChains}
          evmAdditionalConnectors={evmAdditionalConnectors}
          walletConnectId={walletConnectId}
          subscanUrl={subscanUrl}
          infuraApiKey={infuraApiKey}
          alchemyApiKey={alchemyApiKey}
          tenderlyApiKey={tenderlyApiKey}
        >
          <TransactionProvider>
            <TransactionToasts positionProps={transactionToastPositionProps} />
            {children}
          </TransactionProvider>
        </WalletProvider>
      </CentrifugeProvider>
    </QueryClientProvider>
  )
}
