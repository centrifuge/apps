import { UserProvidedConfig } from '@centrifuge/centrifuge-js'
import {
  CentrifugeProvider,
  TransactionProvider,
  TransactionToasts,
  WalletProvider,
} from '@centrifuge/centrifuge-react'
import { GlobalStyle as FabricGlobalStyle, FabricProvider } from '@centrifuge/fabric'
import * as React from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { QueryClient, QueryClientProvider } from 'react-query'
import { HashRouter, NavLinkProps, Navigate, Route, Routes, matchRoutes } from 'react-router-dom'
import { config, evmChains } from '../config'
import { pinToApi } from '../utils/pinToApi'
import { DebugFlags, initialFlagsState } from './DebugFlags'
import { DemoBanner } from './DemoBanner'
import { ExpiringCFGRewardsBanner } from './ExpiringCFGRewardsBanner'
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

export function Root() {
  const [debugState, setDebugState] = React.useState(initialFlagsState)
  const isThemeToggled = debugState.alternativeTheme

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
            <HashRouter>
              <DemoBanner />
              <WalletProvider
                evmChains={evmChains}
                subscanUrl={import.meta.env.REACT_APP_SUBSCAN_URL}
                walletConnectId={import.meta.env.REACT_APP_WALLETCONNECT_ID}
                showAdvancedAccounts={debugState.showAdvancedAccounts as any}
                showTestNets={debugState.showTestNets as any}
                showFinoa={debugState.showFinoa as any}
              >
                <SupportedBrowserBanner />
                <OnboardingAuthProvider>
                  <OnboardingProvider>
                    <DebugFlags onChange={(state) => setDebugState(state)}>
                      <ExpiringCFGRewardsBanner />
                      <TransactionProvider>
                        <TransactionToasts />
                        <LoadBoundary>
                          <AppRoutes />
                        </LoadBoundary>
                      </TransactionProvider>
                    </DebugFlags>
                  </OnboardingProvider>
                </OnboardingAuthProvider>
              </WalletProvider>
            </HashRouter>
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
const SwapsPage = React.lazy(() => import('../pages/Swaps'))
const PortfolioPage = React.lazy(() => import('../pages/Portfolio'))
const TransactionHistoryPage = React.lazy(() => import('../pages/Portfolio/TransactionHistory'))
const TokenOverviewPage = React.lazy(() => import('../pages/Tokens'))
const PrimePage = React.lazy(() => import('../pages/Prime'))
const PrimeDetailPage = React.lazy(() => import('../pages/Prime/Detail'))
const NavManagementPage = React.lazy(() => import('../pages/NavManagement'))
const PoolTransactionsPage = React.lazy(() => import('../pages/PoolTransactions'))
const ConvertAddressPage = React.lazy(() => import('../pages/ConvertAddress'))
const PoolsPage = React.lazy(() => import('../pages/Pools'))

const routes = [
  {
    path: '/issuer/:pid/*',
    element: <IssuerPoolPage />,
  },
  {
    path: '/pools',
    element: <PoolsPage />,
  },
  {
    path: '/pools/:pid/*',
    element: <PoolDetailPage />,
  },
  { path: '/nfts/collection/:cid/object/mint', element: <MintNFTPage /> },
  { path: '/nfts/collection/:cid/object/:nftid', element: <NFTPage /> },
  { path: '/nfts/collection/:cid', element: <CollectionPage /> },
  { path: '/nfts/account', element: <AccountNFTsPage /> },
  { path: '/nfts', element: <CollectionsPage /> },
  { path: '/issuer/create-pool', element: <IssuerCreatePoolPage /> },
  { path: '/history/:address', element: <TransactionHistoryPage /> },
  { path: '/history', element: <TransactionHistoryPage /> },
  { path: '/pools/tokens', element: <TokenOverviewPage />},
  { path: '/pools/:pid/assets/:aid', element: <LoanPage />},
  { path: '/pools/:pid/transactions', element: <PoolTransactionsPage /> },
  { path: '/issuer/:pid/assets/create', element: <IssuerCreateLoanPage /> },
  { path: '/portfolio', element: <PortfolioPage /> },
  { path: '/prime/:dao', element: <PrimeDetailPage /> },
  { path: '/prime', element: <PrimePage /> },
  { path: '/disclaimer', element: <InvestmentDisclaimerPage /> },
  { path: '/onboarding', element: <OnboardingPage /> },
  { path: '/onboarding/verifyEmail', element: <EmailVerified /> },
  { path: '/onboarding/updateInvestorStatus', element: <UpdateInvestorStatus /> },
  { path: '/multisig-approval', element: <MultisigApprovalPage /> },
  { path: '/swaps', element: <SwapsPage /> },
  { path: '/utils/address-format-converter', element: <ConvertAddressPage /> },
  { path: '/nav-management/:pid', element: <NavManagementPage /> },
  { path: '/', element: <Navigate to="/pools" /> },
  { path: '*', element: <NotFoundPage /> },
]

export function findRoute(pathname: string) {
  const matchedRoutes = matchRoutes(routes, { pathname })
  return matchedRoutes ? matchedRoutes[0] : null
}

export function prefetchRoute(to: string | NavLinkProps['to']) {
  const pathname = typeof to === 'string' ? to : 'pathname' in to ? to.pathname : null
  const route = pathname ? findRoute(pathname) : null
  const Comp = route?.route.element
  try {
    if (Comp && '_init' in Comp && '_payload' in Comp) Comp._init(Comp._payload)
  } catch (error) {
    console.error('Error prefetching route:', error)
  }
}

function AppRoutes() {
  return (
    <Routes>
      {routes.map((route, i) => (
        <Route key={i} path={route.path} element={route.element} />
      ))}
    </Routes>
  )
}
