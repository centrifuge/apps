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
import { AccountNFTsPage } from '../pages/AccountNFTs'
import { CollectionPage } from '../pages/Collection'
import { CollectionsPage } from '../pages/Collections'
import { InvestmentDisclaimerPage } from '../pages/InvestmentDisclaimer'
import { IssuerCreatePoolPage } from '../pages/IssuerCreatePool'
import { IssuerPoolPage } from '../pages/IssuerPool'
import { IssuerCreateLoanPage } from '../pages/IssuerPool/Assets/CreateLoan'
import { LoanPage } from '../pages/Loan'
import { MintNFTPage } from '../pages/MintNFT'
import { MultisigApprovalPage } from '../pages/MultisigApproval'
import { NFTPage } from '../pages/NFT'
import { NotFoundPage } from '../pages/NotFound'
import { OnboardingPage } from '../pages/Onboarding'
import { EmailVerified } from '../pages/Onboarding/EmailVerified'
import { UpdateInvestorStatus } from '../pages/Onboarding/UpdateInvestorStatus'
import { PoolDetailPage } from '../pages/Pool'
import { PoolsPage } from '../pages/Pools'
import { TokenOverviewPage } from '../pages/Tokens'
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
