import { altairDark, centrifugeLight, FabricProvider, GlobalStyle as FabricGlobalStyle } from '@centrifuge/fabric'
import * as React from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import { DefaultTheme } from 'styled-components'
import { AccountNFTsPage } from '../pages/AccountNFTs'
import { CollectionPage } from '../pages/Collection'
import { CollectionsPage } from '../pages/Collections'
import { CreateLoanPage } from '../pages/CreateLoan'
import { InvestmentsTokenPage } from '../pages/InvestmentsToken'
import { InvestmentsTokensPage } from '../pages/InvestmentsTokens'
import { IssuerCreatePoolPage } from '../pages/IssuerCreatePool'
import { IssuerPoolPage } from '../pages/IssuerPool'
import { LoanPage } from '../pages/Loan'
import { ManagedPoolsPage } from '../pages/ManagedPools'
import { MintNFTPage } from '../pages/MintNFT'
import { NFTPage } from '../pages/NFT'
import { NotFoundPage } from '../pages/NotFound'
import { PoolDetailPage } from '../pages/PoolDetail'
import { PoolsPage } from '../pages/Pools'
import { TokenDetailPage } from '../pages/Token'
import { TokenOverviewPage } from '../pages/Tokens'
import { CentrifugeProvider } from './CentrifugeProvider'
import { DebugFlags, initialFlagsState } from './DebugFlags'
import { GlobalStyle } from './GlobalStyle'
import { HostPermissionsProvider } from './HostPermissions'
import { LoadBoundary } from './LoadBoundary'
import { TransactionProvider } from './TransactionsProvider'
import { TransactionToasts } from './TransactionToasts'
import { Web3Provider } from './Web3Provider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
    },
  },
})

const lightTheme: DefaultTheme = {
  ...centrifugeLight,
  sizes: {
    ...centrifugeLight.sizes,
    container: '100%',
  },
  colors: {
    ...centrifugeLight.colors,
    placeholderBackground: centrifugeLight.colors.backgroundSecondary,
  },
  typography: {
    ...centrifugeLight.typography,
    headingLarge: {
      fontSize: [24, 24, 36],
      lineHeight: 1.25,
      fontWeight: 600,
      color: 'textPrimary',
    },
  },
}
const darkTheme: DefaultTheme = {
  ...altairDark,
  sizes: {
    ...altairDark.sizes,
    container: '100%',
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

export const Root: React.VFC = () => {
  const [isDark, setIsDark] = React.useState(!!initialFlagsState.altairDarkMode)
  return (
    <QueryClientProvider client={queryClient}>
      <FabricProvider theme={isDark ? darkTheme : lightTheme}>
        <GlobalStyle />
        <FabricGlobalStyle />
        <HostPermissionsProvider>
          <Web3Provider>
            <CentrifugeProvider>
              <DebugFlags onChange={(state) => setIsDark(!!state.altairDarkMode)}>
                <TransactionProvider>
                  <TransactionToasts />
                  <Router>
                    <LoadBoundary>
                      <Routes />
                    </LoadBoundary>
                  </Router>
                </TransactionProvider>
              </DebugFlags>
            </CentrifugeProvider>
          </Web3Provider>
        </HostPermissionsProvider>
      </FabricProvider>
    </QueryClientProvider>
  )
}

const Routes: React.VFC = () => {
  return (
    <Switch>
      <Route path="/nfts/collection/:cid/object/mint">
        <MintNFTPage />
      </Route>
      <Route path="/nfts/collection/:cid/object/:nftid/new-asset">
        <CreateLoanPage />
      </Route>
      <Route path="/nfts/collection/:cid/object/:nftid">
        <NFTPage />
      </Route>
      <Route path="/nfts/collection/:cid">
        <CollectionPage />
      </Route>
      <Route path="/nfts/account">
        <AccountNFTsPage />
      </Route>
      <Route path="/nfts">
        <CollectionsPage />
      </Route>
      <Route path="/pools/:pid/assets/:aid">
        <LoanPage />
      </Route>
      <Route path="/pools/:pid">
        <PoolDetailPage />
      </Route>
      <Route path="/pools">
        <PoolsPage />
      </Route>
      <Route path="/issuer/create-pool">
        <IssuerCreatePoolPage />
      </Route>
      <Route path="/issuer/:pid">
        <IssuerPoolPage />
      </Route>
      <Route path="/investments/tokens/:pid/:tid">
        <InvestmentsTokenPage />
      </Route>
      <Route path="/investments/tokens">
        <InvestmentsTokensPage />
      </Route>
      <Route path="/investments">
        <InvestmentsTokensPage />
      </Route>
      <Route path="/issuers/managed-pools">
        <ManagedPoolsPage />
      </Route>
      <Route path="/tokens/:pid/:tid">
        <TokenDetailPage />
      </Route>
      <Route path="/tokens">
        <TokenOverviewPage />
      </Route>
      <Route exact path="/">
        <TokenOverviewPage />
      </Route>
      <Route>
        <NotFoundPage />
      </Route>
    </Switch>
  )
}
