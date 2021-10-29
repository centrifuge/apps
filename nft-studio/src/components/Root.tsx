import { GlobalStyle as FabricGlobalStyle } from '@centrifuge/fabric'
// import altairDark from '@centrifuge/fabric/dist/theme/altairDark'
import centrifugeLight from '@centrifuge/fabric/dist/theme/centrifugeLight'
import * as React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import { DefaultTheme, ThemeProvider } from 'styled-components'
import { CollectionPage } from '../pages/Collection'
import { CollectionsPage } from '../pages/Collections'
import { CreateCollectionPage } from '../pages/CreateCollection'
import { MintNFTPage } from '../pages/MintNFT'
import { NFTPage } from '../pages/NFT'
import { GlobalStyle } from './GlobalStyle'
import { NavBar } from './NavBar'
import { TransactionProvider } from './TransactionsProvider'
import { Web3Provider } from './Web3Provider'

const theme: DefaultTheme = {
  ...centrifugeLight,
  sizes: {
    ...centrifugeLight.sizes,
    container: '100%',
    navBarHeight: 72,
    navBarHeightMobile: 64,
  },
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
    },
  },
})

export const Root: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <FabricGlobalStyle />
        <Web3Provider>
          <TransactionProvider>
            <Router>
              <NavBar title="NFT Studio" />
              <Switch>
                <Route path="/collection/:cid/object/mint">
                  <MintNFTPage />
                </Route>
                <Route path="/collection/:cid/object/:nftid">
                  <NFTPage />
                </Route>
                <Route path="/collection/create">
                  <CreateCollectionPage />
                </Route>
                <Route path="/collection/:cid">
                  <CollectionPage />
                </Route>
                <Route path="/">
                  <CollectionsPage />
                </Route>
              </Switch>
            </Router>
          </TransactionProvider>
        </Web3Provider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
