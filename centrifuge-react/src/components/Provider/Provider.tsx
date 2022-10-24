import * as React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { CentrifugeProvider, CentrifugeProviderProps } from '../CentrifugeProvider'
import { TransactionProvider, TransactionToasts, TransactionToastsProps } from '../Transactions'
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
  transactionToastPositionProps?: TransactionToastsProps['positionProps']
}

export function Provider({ children, centrifugeConfig, subscanUrl, transactionToastPositionProps }: ProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <CentrifugeProvider config={centrifugeConfig}>
        <WalletProvider>
          <TransactionProvider>
            <TransactionToasts subscanUrl={subscanUrl} positionProps={transactionToastPositionProps} />
            {children}
          </TransactionProvider>
        </WalletProvider>
      </CentrifugeProvider>
    </QueryClientProvider>
  )
}
