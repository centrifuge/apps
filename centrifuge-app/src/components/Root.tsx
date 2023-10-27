import { UserProvidedConfig } from '@centrifuge/centrifuge-js'
import {
  CentrifugeProvider,
  EvmChains,
  TransactionProvider,
  TransactionToasts,
  WalletProvider,
} from '@centrifuge/centrifuge-react'
import { FabricProvider, GlobalStyle as FabricGlobalStyle } from '@centrifuge/fabric'
import ethereumLogo from '@centrifuge/fabric/assets/logos/ethereum.svg'
import goerliLogo from '@centrifuge/fabric/assets/logos/goerli.svg'
import * as React from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClient, QueryClientProvider } from 'react-query'
import { BrowserRouter as Router, Redirect, Route, Switch } from 'react-router-dom'
import { config, ethConfig } from '../config'
import PoolsPage from '../pages/Pools'
import { pinToApi } from '../utils/pinToApi'
import { DebugFlags, initialFlagsState } from './DebugFlags'
import { DemoBanner } from './DemoBanner'
import { GlobalStyle } from './GlobalStyle'
import { Head } from './Head'
import { LoadBoundary } from './LoadBoundary'
import { OnboardingAuthProvider } from './OnboardingAuthProvider'
import { OnboardingProvider } from './OnboardingProvider'
import { SupportedBrowserBanner } from './SupportedBrowserBanner'

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
  pinJson: (json) =>
    pinToApi('pinJson', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ json }),
    }),
}

const infuraKey = import.meta.env.REACT_APP_INFURA_KEY

const evmChains: EvmChains =
  ethConfig.network === 'mainnet'
    ? {
        1: {
          urls: [`https://mainnet.infura.io/v3/${infuraKey}`],
          iconUrl: ethereumLogo,
        },
        8453: {
          urls: ['https://mainnet.base.org'],
          iconUrl: 'https://docs.base.org/img/logo_dark.svg',
        },
      }
    : {
        1: {
          urls: [`https://mainnet.infura.io/v3/${infuraKey}`],
          iconUrl: ethereumLogo,
        },
        5: {
          urls: [`https://goerli.infura.io/v3/${infuraKey}`],
          iconUrl: goerliLogo,
        },
        8453: {
          urls: ['https://mainnet.base.org'],
          iconUrl: 'https://docs.base.org/img/logo.svg',
        },
        84531: {
          urls: ['https://goerli.base.org'],
          iconUrl: 'https://docs.base.org/img/logo.svg',
        },
      }

export function Root() {
  const [isThemeToggled, setIsThemeToggled] = React.useState(!!initialFlagsState.alternativeTheme)
  const [showAdvancedAccounts, setShowAdvancedAccounts] = React.useState(!!initialFlagsState.showAdvancedAccounts)
  const [showBase, setShowBase] = React.useState(!!initialFlagsState.showBase)

  return (
    <>
      <HelmetProvider>
        <Head />
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
            <SupportedBrowserBanner />
            <WalletProvider
              evmChains={evmChains}
              subscanUrl={import.meta.env.REACT_APP_SUBSCAN_URL}
              walletConnectId={import.meta.env.REACT_APP_WALLETCONNECT_ID}
              showAdvancedAccounts={showAdvancedAccounts}
              showBase={showBase}
            >
              <OnboardingAuthProvider>
                <OnboardingProvider>
                  <DebugFlags
                    onChange={(state) => {
                      setIsThemeToggled(!!state.alternativeTheme)
                      setShowAdvancedAccounts(!!state.showAdvancedAccounts)
                      setShowBase(!!state.showBase)
                    }}
                  >
                    <TransactionProvider>
                      <TransactionToasts />
                      <Router>
                        <LoadBoundary>
                          <Routes />
                        </LoadBoundary>
                      </Router>
                    </TransactionProvider>
                  </DebugFlags>
                </OnboardingProvider>
              </OnboardingAuthProvider>
            </WalletProvider>
          </CentrifugeProvider>
        </FabricProvider>
      </QueryClientProvider>
    </>
  )
}

const AccountNFTsPage = React.lazy(() => import('../pages/AccountNFTs'))
const CollectionPage = React.lazy(() => import('../pages/Collection'))
const CollectionsPage = React.lazy(() => import('../pages/Collections'))
const InvestmentDisclaimerPage = React.lazy(() => import('../pages/InvestmentDisclaimer'))
const IssuerCreatePoolPage = React.lazy(() => import('../pages/IssuerCreatePool'))
const IssuerPoolPage = React.lazy(() => import('../pages/IssuerPool'))
const IssuerCreateLoanPage = React.lazy(() => import('../pages/IssuerPool/Assets/CreateLoan'))
const LoanPage = React.lazy(() => import('../pages/Loan'))
const MintNFTPage = React.lazy(() => import('../pages/MintNFT'))
const MultisigApprovalPage = React.lazy(() => import('../pages/MultisigApproval'))
const NFTPage = React.lazy(() => import('../pages/NFT'))
const NotFoundPage = React.lazy(() => import('../pages/NotFound'))
const OnboardingPage = React.lazy(() => import('../pages/Onboarding'))
const EmailVerified = React.lazy(() => import('../pages/Onboarding/EmailVerified'))
const UpdateInvestorStatus = React.lazy(() => import('../pages/Onboarding/UpdateInvestorStatus'))
const PoolDetailPage = React.lazy(() => import('../pages/Pool'))
const PortfolioPage = React.lazy(() => import('../pages/Portfolio'))
const TransactionHistoryPage = React.lazy(() => import('../pages/Portfolio/TransactionHistory'))
const TokenOverviewPage = React.lazy(() => import('../pages/Tokens'))

function Routes() {
  return (
    <Switch>
      <Route path="/nfts/collection/:cid/object/mint">
        <MintNFTPage />
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
      <Route path="/pools/:pid/assets/:aid">
        <LoanPage />
      </Route>
      <Route path="/pools/tokens">
        <TokenOverviewPage />
      </Route>
      <Route path="/pools/:pid">
        <PoolDetailPage />
      </Route>
      <Route path="/pools">
        <PoolsPage />
      </Route>
      <Route path="/history">
        <TransactionHistoryPage />
      </Route>
      <Route path="/portfolio">
        <PortfolioPage />
      </Route>
      <Route path="/disclaimer">
        <InvestmentDisclaimerPage />
      </Route>
      <Route exact path="/onboarding">
        <OnboardingPage />
      </Route>
      <Route exact path="/onboarding/verifyEmail">
        <EmailVerified />
      </Route>
      <Route exact path="/onboarding/updateInvestorStatus">
        <UpdateInvestorStatus />
      </Route>
      <Route exact path="/multisig-approval">
        <MultisigApprovalPage />
      </Route>
      <Route exact path="/">
        <Redirect to="/pools" />
      </Route>
      <Route>
        <NotFoundPage />
      </Route>
    </Switch>
  )
}
