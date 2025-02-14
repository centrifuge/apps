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
import { NavLinkProps, Navigate, RouterProvider, createHashRouter, matchRoutes } from 'react-router-dom'
import { config, evmChains } from '../config'
import { pinToApi } from '../utils/pinToApi'
import { DebugFlags, initialFlagsState } from './DebugFlags'
import { DemoBanner } from './DemoBanner'
import { ExpiringCFGRewardsBanner } from './ExpiringCFGRewardsBanner'
import { GlobalStyle } from './GlobalStyle'
import { Head } from './Head'
import { LayoutBase } from './LayoutBase'
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

const AccountNFTsPage = React.lazy(() => import('../pages/AccountNFTs'))
const CollectionPage = React.lazy(() => import('../pages/Collection'))
const CollectionsPage = React.lazy(() => import('../pages/Collections'))
const InvestmentDisclaimerPage = React.lazy(() => import('../pages/InvestmentDisclaimer'))
const IssuerCreatePoolPage = React.lazy(() => import('../pages/IssuerCreatePool'))
const IssuerPoolPage = React.lazy(() => import('../pages/IssuerPool'))
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
const PrimePage = React.lazy(() => import('../pages/Prime'))
const PrimeDetailPage = React.lazy(() => import('../pages/Prime/Detail'))
const NavManagementPage = React.lazy(() => import('../pages/NavManagement'))
const PoolTransactionsPage = React.lazy(() => import('../pages/PoolTransactions'))
const ConvertAddressPage = React.lazy(() => import('../pages/ConvertAddress'))
const PoolsPage = React.lazy(() => import('../pages/Pools'))
const DashboardPage = React.lazy(() => import('../pages/Dashboard'))

const router = createHashRouter([
  {
    path: '/',
    element: <LayoutBase />,
    children: [
      {
        path: '/',
        element: <Navigate to="/pools" replace />,
      },
      {
        path: '/dashboard/*',
        element: <DashboardPage />,
        handle: { component: DashboardPage },
      },
      {
        path: '/pools',
        element: <PoolsPage />,
        handle: { component: PoolsPage },
      },
      {
        path: '/pools/:pid/*',
        element: <PoolDetailPage />,
        handle: { component: PoolDetailPage },
      },
      {
        path: '/issuer/:pid/*',
        element: <IssuerPoolPage />,
        handle: { component: IssuerPoolPage },
      },
      { path: '/nfts/collection/:cid/object/mint', element: <MintNFTPage />, handle: { component: MintNFTPage } },
      { path: '/nfts/collection/:cid/object/:nftid', element: <NFTPage />, handle: { component: NFTPage } },
      { path: '/nfts/collection/:cid', element: <CollectionPage />, handle: { component: CollectionPage } },
      { path: '/nfts/account', element: <AccountNFTsPage />, handle: { component: AccountNFTsPage } },
      { path: '/nfts', element: <CollectionsPage />, handle: { component: CollectionsPage } },
      { path: '/issuer/create-pool', element: <IssuerCreatePoolPage />, handle: { component: IssuerCreatePoolPage } },
      { path: '/history/:address', element: <TransactionHistoryPage />, handle: { component: TransactionHistoryPage } },
      { path: '/history', element: <TransactionHistoryPage />, handle: { component: TransactionHistoryPage } },
      { path: '/pools/:pid/assets/:aid', element: <LoanPage />, handle: { component: LoanPage } },
      {
        path: '/pools/:pid/transactions',
        element: <PoolTransactionsPage />,
        handle: { component: PoolTransactionsPage },
      },
      { path: '/portfolio', element: <PortfolioPage />, handle: { component: PortfolioPage } },
      { path: '/prime/:dao', element: <PrimeDetailPage />, handle: { component: PrimeDetailPage } },
      { path: '/prime', element: <PrimePage />, handle: { component: PrimePage } },
      { path: '/disclaimer', element: <InvestmentDisclaimerPage />, handle: { component: InvestmentDisclaimerPage } },
      { path: '/onboarding', element: <OnboardingPage />, handle: { component: OnboardingPage } },
      { path: '/onboarding/verifyEmail', element: <EmailVerified />, handle: { component: EmailVerified } },
      {
        path: '/onboarding/updateInvestorStatus',
        element: <UpdateInvestorStatus />,
        handle: { component: UpdateInvestorStatus },
      },
      { path: '/multisig-approval', element: <MultisigApprovalPage />, handle: { component: MultisigApprovalPage } },
      { path: '/swaps', element: <SwapsPage />, handle: { component: SwapsPage } },
      {
        path: '/utils/address-format-converter',
        element: <ConvertAddressPage />,
        handle: { component: ConvertAddressPage },
      },
      { path: '/nav-management/:pid', element: <NavManagementPage />, handle: { component: NavManagementPage } },
      { path: '*', element: <NotFoundPage />, handle: { component: NotFoundPage } },
    ],
    errorElement: <NotFoundPage />,
  },
])

export function findRoute(pathname: string) {
  const matchedRoutes = matchRoutes(router.routes, { pathname })
  return matchedRoutes ? matchedRoutes[0] : null
}

export function prefetchRoute(to: string | NavLinkProps['to']) {
  const pathname = typeof to === 'string' ? to : 'pathname' in to ? to.pathname : null
  const route = pathname ? findRoute(pathname) : null
  const Comp = route?.route.handle?.component

  try {
    if (Comp && '_init' in Comp && '_payload' in Comp) {
      ;(Comp as any)._init(Comp._payload)
    }
  } catch (error) {
    console.error('Error prefetching route:', error)
  }
}

export function Root() {
  const [debugState, setDebugState] = React.useState(initialFlagsState)

  return (
    <>
      <HelmetProvider>
        <Head />
      </HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <FabricProvider theme={config.themes.light}>
          <GlobalStyle />
          <FabricGlobalStyle />
          <CentrifugeProvider config={centConfig}>
            <DemoBanner />
            <WalletProvider
              evmChains={evmChains}
              subscanUrl={import.meta.env.REACT_APP_SUBSCAN_URL}
              walletConnectId={import.meta.env.REACT_APP_WALLETCONNECT_ID}
              showAdvancedAccounts={debugState.showAdvancedAccounts}
              showTestNets={debugState.showTestNets}
              showFinoa={debugState.showFinoa}
              infuraApiKey={import.meta.env.REACT_APP_INFURA_KEY}
              alchemyApiKey={import.meta.env.REACT_APP_ALCHEMY_KEY}
              tenderlyApiKey={import.meta.env.REACT_APP_TENDERLY_KEY}
            >
              <SupportedBrowserBanner />
              <OnboardingAuthProvider>
                <OnboardingProvider>
                  <DebugFlags onChange={(state) => setDebugState(state)}>
                    <ExpiringCFGRewardsBanner />
                    <TransactionProvider>
                      <TransactionToasts />
                      <LoadBoundary>
                        <RouterProvider router={router} />
                      </LoadBoundary>
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
