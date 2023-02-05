import { UserProvidedConfig } from '@centrifuge/centrifuge-js'
import {
  CentrifugeProvider,
  TransactionProvider,
  TransactionToasts,
  WalletProvider,
} from '@centrifuge/centrifuge-react'
import { FabricProvider, GlobalStyle as FabricGlobalStyle } from '@centrifuge/fabric'
import * as React from 'react'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import { QueryClient, QueryClientProvider } from 'react-query'
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom'
import { config } from '../config'
import { AccountNFTsPage } from '../pages/AccountNFTs'
import { CollectionPage } from '../pages/Collection'
import { CollectionsPage } from '../pages/Collections'
import { CreateLoanFromNFTPage } from '../pages/CreateLoanFromNFT'
import { IssuerCreatePoolPage } from '../pages/IssuerCreatePool'
import { IssuerPoolPage } from '../pages/IssuerPool'
import { IssuerCreateLoanPage } from '../pages/IssuerPool/Assets/CreateLoan'
import { LoanPage } from '../pages/Loan'
import { MintNFTPage } from '../pages/MintNFT'
import { NFTPage } from '../pages/NFT'
import { NotFoundPage } from '../pages/NotFound'
import { OnboardingPage } from '../pages/Onboarding'
import { EmailVerified } from '../pages/Onboarding/EmailVerified'
import { PoolDetailPage } from '../pages/Pool'
import { PoolsPage } from '../pages/Pools'
import { TokenOverviewPage } from '../pages/Tokens'
import { fetchLambda } from '../utils/fetchLambda'
import { AuthProvider } from './AuthProvider'
import { DebugFlags, initialFlagsState } from './DebugFlags'
import { DemoBanner } from './DemoBanner'
import { GlobalStyle } from './GlobalStyle'
import { LoadBoundary } from './LoadBoundary'
import { OnboardingUserProvider } from './OnboardingUserProvider'
import { PodAuthProvider } from './PodAuthProvider'
import { pinToApi } from '../utils/pinToApi'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
    },
  },
})

const centConfig: UserProvidedConfig = {
  network: config.network,
  kusamaWsUrl: import.meta.env.REACT_APP_RELAY_WSS_URL as string,
  polkadotWsUrl: import.meta.env.REACT_APP_RELAY_WSS_URL as string,
  altairWsUrl: import.meta.env.REACT_APP_COLLATOR_WSS_URL as string,
  centrifugeWsUrl: import.meta.env.REACT_APP_COLLATOR_WSS_URL as string,
  printExtrinsics: import.meta.env.NODE_ENV === 'development',
  centrifugeSubqueryUrl: import.meta.env.REACT_APP_SUBQUERY_URL as string,
  altairSubqueryUrl: import.meta.env.REACT_APP_SUBQUERY_URL as string,
  metadataHost: import.meta.env.REACT_APP_IPFS_GATEWAY as string,
  pinFile: (b64URI) =>
    pinToApi('pinFile', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ uri: b64URI }),
    }),
  unpinFile: (hash) =>
    pinToApi('unpinFile', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ hash }),
    }),
  pinJson: (json) =>
    pinToApi('pinJson', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json }),
    }),  
}

export const Root: React.VFC = () => {
  const [isThemeToggled, setIsThemeToggled] = React.useState(!!initialFlagsState.alternativeTheme)

  return (
    <>
      <HelmetProvider>
        <Helmet>
          <title>{config.network === 'centrifuge' ? 'Centrifuge App' : 'Altair App'}</title>
        </Helmet>
      </HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <FabricProvider
          theme={
            !isThemeToggled
              ? config.themes[config.defaultTheme]
              : config.defaultTheme === 'dark'
              ? config.themes.light
              : config.themes.dark
          }
        >
          <GlobalStyle />
          <FabricGlobalStyle />
          <CentrifugeProvider config={centConfig}>
            <DemoBanner />
            <WalletProvider>
              <PodAuthProvider>
                <AuthProvider>
                  <DebugFlags onChange={(state) => setIsThemeToggled(!!state.alternativeTheme)}>
                    <TransactionProvider>
                      <TransactionToasts subscanUrl={import.meta.env.REACT_APP_SUBSCAN_URL} />
                      <Router>
                        <LoadBoundary>
                          <Routes />
                        </LoadBoundary>
                      </Router>
                    </TransactionProvider>
                  </DebugFlags>
                </AuthProvider>
              </PodAuthProvider>
            </WalletProvider>
          </CentrifugeProvider>
        </FabricProvider>
      </QueryClientProvider>
    </>
  )
}

const Routes: React.VFC = () => {
  return (
    <Switch>
      <Route path="/nfts/collection/:cid/object/mint">
        <MintNFTPage />
      </Route>
      <Route path="/nfts/collection/:cid/object/:nftid/new-asset">
        <CreateLoanFromNFTPage />
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
      <Route path="/issuer/create-pool">
        <IssuerCreatePoolPage />
      </Route>
      <Route path="/issuer/:pid/assets/create">
        <IssuerCreateLoanPage />
      </Route>
      <Route exact path="/issuer/:pid/assets/:aid">
        <LoanPage />
      </Route>
      <Route path="/issuer/:pid">
        <IssuerPoolPage />
      </Route>
      <Route path="/investments/:pid/assets/:aid">
        <LoanPage />
      </Route>
      <Route path="/investments/tokens">
        <TokenOverviewPage />
      </Route>
      <Route path="/investments/:pid">
        <PoolDetailPage />
      </Route>
      <Route path="/investments">
        <PoolsPage />
      </Route>
      <Route exact path="/onboarding">
        <OnboardingUserProvider>
          <OnboardingPage />
        </OnboardingUserProvider>
      </Route>
      <Route exact path="/onboarding/verifyEmail">
        <EmailVerified />
      </Route>
      <Route exact path="/">
        <Redirect to="/investments" />
      </Route>
      <Route>
        <NotFoundPage />
      </Route>
    </Switch>
  )
}
