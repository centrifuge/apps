import { GlobalStyle as FabricGlobalStyle } from '@centrifuge/fabric'
import altairDark from '@centrifuge/fabric/dist/theme/altairDark'
import { OverlayProvider } from '@react-aria/overlays'
import * as React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import { DefaultTheme, ThemeProvider } from 'styled-components'
import { AccountNFTsPage } from '../pages/AccountNFTs'
import { CollectionPage } from '../pages/Collection'
import { CollectionsPage } from '../pages/Collections'
import { CreateLoanPage } from '../pages/CreateLoan'
import { LoanPage } from '../pages/Loan'
import { LoansPage } from '../pages/Loans'
import { ManagedPoolsPage } from '../pages/ManagedPools'
import { MintNFTPage } from '../pages/MintNFT'
import { NFTPage } from '../pages/NFT'
import { NotFoundPage } from '../pages/NotFound'
import { PoolPage } from '../pages/Pool'
import { PoolFormPage } from '../pages/PoolForm/index'
import { PoolsPage } from '../pages/Pools'
import { TokenPage } from '../pages/Token'
import { TokensPage } from '../pages/Tokens'
import { CentrifugeProvider } from './CentrifugeProvider'
import { useDebugFlags } from './DebugFlags'
import { GlobalStyle } from './GlobalStyle'
import { HostPermissionsProvider } from './HostPermissions'
import { LoadBoundary } from './LoadBoundary'
import { TransactionProvider } from './TransactionsProvider'
import { TransactionToasts } from './TransactionToasts'
import { Web3Provider } from './Web3Provider'

const darkTheme: DefaultTheme = {
  ...altairDark,
  sizes: {
    ...altairDark.sizes,
    container: '100%',
    navBarHeight: 72,
    navBarHeightMobile: 64,
    dialog: 564,
  },
  colors: {
    ...altairDark.colors,
    placeholderBackground: altairDark.colors.backgroundSecondary,
  },
  typography: {
    ...altairDark.typography,
    headingLarge: {
      fontSize: [24, 24, 36],
      lineHeight: 1.25,
      fontWeight: 600,
      color: 'textPrimary',
    },
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
  const showOnlyNFT = useDebugFlags().showOnlyNFT
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={darkTheme}>
        <GlobalStyle />
        <FabricGlobalStyle />
        <OverlayProvider>
          <HostPermissionsProvider>
            <Web3Provider>
              <CentrifugeProvider>
                <TransactionProvider>
                  <TransactionToasts />
                  <Router>
                    <LoadBoundary>
                      {showOnlyNFT ? (
                        <Switch>
                          <Route path="/collection/:cid/object/mint">
                            <MintNFTPage />
                          </Route>
                          <Route path="/collection/:cid/object/:nftid/new-asset">
                            <CreateLoanPage />
                          </Route>
                          <Route path="/collection/:cid/object/:nftid">
                            <NFTPage />
                          </Route>
                          <Route path="/collection/:cid">
                            <CollectionPage />
                          </Route>
                          <Route path="/account">
                            <AccountNFTsPage />
                          </Route>
                          <Route path="/nfts">
                            <CollectionsPage />
                          </Route>
                          <Route exact path="/">
                            <CollectionsPage />
                          </Route>
                          <Route>
                            <NotFoundPage />
                          </Route>
                        </Switch>
                      ) : (
                        <Switch>
                          <Route path="/collection/:cid/object/mint">
                            <MintNFTPage />
                          </Route>
                          <Route path="/collection/:cid/object/:nftid/new-asset">
                            <CreateLoanPage />
                          </Route>
                          <Route path="/collection/:cid/object/:nftid">
                            <NFTPage />
                          </Route>
                          <Route path="/collection/:cid">
                            <CollectionPage />
                          </Route>
                          <Route path="/account">
                            <AccountNFTsPage />
                          </Route>
                          <Route path="/nfts">
                            <CollectionsPage />
                          </Route>
                          <Route path="/pools/:pid/assets/:aid">
                            <LoanPage />
                          </Route>
                          <Route path="/pools/:pid">
                            <PoolPage />
                          </Route>
                          <Route path="/pools">
                            <PoolsPage />
                          </Route>
                          <Route path="/pool/new">
                            <PoolFormPage />
                          </Route>
                          <Route path="/issuers/assets">
                            <LoansPage />
                          </Route>
                          <Route path="/investments/tokens/:pid/:tid">
                            <TokenPage />
                          </Route>
                          <Route path="/investments/tokens">
                            <TokensPage />
                          </Route>
                          <Route path="/investments">
                            <TokensPage />
                          </Route>
                          <Route path="/issuers/managed-pools">
                            <ManagedPoolsPage />
                          </Route>
                          <Route exact path="/">
                            <PoolsPage />
                          </Route>
                          <Route>
                            <NotFoundPage />
                          </Route>
                        </Switch>
                      )}
                    </LoadBoundary>
                  </Router>
                </TransactionProvider>
              </CentrifugeProvider>
            </Web3Provider>
          </HostPermissionsProvider>
        </OverlayProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
