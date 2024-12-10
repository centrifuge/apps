import { FabricProvider, centrifugeTheme } from '@centrifuge/fabric'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, useAccount } from 'wagmi'
import { TransactionProvider } from './components/Transactions/TransactionsProvider'
import { Account } from './components/account'
import { WalletOptions } from './components/wallet-options'
import { wagmiConfig } from './config/wagmiConfig'

const queryClient = new QueryClient()

function ConnectWallet() {
  const { isConnected } = useAccount()
  if (isConnected) return <Account />
  return <WalletOptions />
}

function App() {
  return (
    <FabricProvider theme={centrifugeTheme}>
      <TransactionProvider>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <ConnectWallet />
          </QueryClientProvider>
        </WagmiProvider>
      </TransactionProvider>
    </FabricProvider>
  )
}

export default App
