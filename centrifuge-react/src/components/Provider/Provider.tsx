import * as React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { CentrifugeProvider, CentrifugeProviderProps } from '../CentrifugeProvider'
import { TransactionProvider, TransactionToasts } from '../Transactions'
import { WalletProvider } from '../WalletProvider'

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
  subscanUrl?: string
}

export function Provider({ children, centrifugeConfig, subscanUrl }: ProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <CentrifugeProvider config={centrifugeConfig}>
        <WalletProvider>
          <TransactionProvider>
            <TransactionToasts subscanUrl={subscanUrl} />
            {children}
          </TransactionProvider>
        </WalletProvider>
      </CentrifugeProvider>
    </QueryClientProvider>
  )
}
