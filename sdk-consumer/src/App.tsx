import { FabricProvider, centrifugeTheme } from '@centrifuge/fabric'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { Invest } from './components/Invest'
import { TransactionProvider } from './components/Transactions/TransactionsProvider'
import { wagmiConfig } from './config/wagmiConfig'

const queryClient = new QueryClient()

export function App() {
  return (
    <FabricProvider theme={centrifugeTheme}>
      <TransactionProvider>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <Invest />
          </QueryClientProvider>
        </WagmiProvider>
      </TransactionProvider>
    </FabricProvider>
  )
}
