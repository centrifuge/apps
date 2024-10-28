import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { WagmiProvider, useAccount } from 'wagmi'
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
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectWallet />
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
