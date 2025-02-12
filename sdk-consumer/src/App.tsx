import { FabricProvider, Stack, Tabs, TabsItem, centrifugeTheme } from '@centrifuge/fabric'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { Invest } from './components/Invest'
import { Report } from './components/Report'
import { TransactionProvider } from './components/Transactions/TransactionsProvider'
import { wagmiConfig } from './config/wagmiConfig'

const queryClient = new QueryClient()

export function App() {
  return (
    <FabricProvider theme={centrifugeTheme}>
      <TransactionProvider>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <Page />
          </QueryClientProvider>
        </WagmiProvider>
      </TransactionProvider>
    </FabricProvider>
  )
}

function Page() {
  const [selectedTab, setSelectedTab] = useState(0)

  return (
    <Stack gap={2}>
      <Tabs selectedIndex={selectedTab} onChange={(index) => setSelectedTab(index)}>
        <TabsItem>Invest</TabsItem>
        <TabsItem>Some report</TabsItem>
      </Tabs>
      {[<Invest />, <Report />][selectedTab]}
    </Stack>
  )
}
