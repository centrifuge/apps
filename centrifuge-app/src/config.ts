import { TransactionOptions } from '@centrifuge/centrifuge-js'
import { EvmChains } from '@centrifuge/centrifuge-react'
import { altairDark, centrifugeLight } from '@centrifuge/fabric'
import arbitrumLogo from '@centrifuge/fabric/assets/logos/arbitrum.svg'
import assetHubLogo from '@centrifuge/fabric/assets/logos/assethub.svg'
import baseLogo from '@centrifuge/fabric/assets/logos/base.svg'
import celoLogo from '@centrifuge/fabric/assets/logos/celo.svg'
import ethereumLogo from '@centrifuge/fabric/assets/logos/ethereum.svg'
import goerliLogo from '@centrifuge/fabric/assets/logos/goerli.svg'
import sepoliaLogo from '@centrifuge/fabric/assets/logos/sepolia.png'
import * as React from 'react'
import { DefaultTheme } from 'styled-components'
import { LogoAltair, LogoAltairText } from './components/LogoAltair'
import { LogoCentrifuge, LogoCentrifugeText } from './components/LogoCentrifuge'

export const FEATURED_COLLECTIONS = [
  '3410462771',
  '1761235385',
  '2866607643',
  '3295454411',
  '420584179',
  '1298321265',
  '353744957',
]

const lightTheme: DefaultTheme = {
  ...centrifugeLight,
  sizes: {
    ...centrifugeLight.sizes,
    mainContent: 1800,
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
    mainContent: 1800,
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

type EnvironmentConfig = {
  name: string
  logo: React.ComponentType<any>[]
  network: 'altair' | 'centrifuge'
  themes: {
    light: DefaultTheme
    dark: DefaultTheme
  }
  defaultTheme: 'light' | 'dark'
  baseCurrency: 'USD'
  assetClasses: Record<'Public credit' | 'Private credit', string[]>
  poolCreationType: TransactionOptions['createType']
  useDocumentNfts: boolean
  defaultPodUrl: string
}

const poolCreationType = import.meta.env.REACT_APP_POOL_CREATION_TYPE || 'immediate'
const defaultPodUrl = import.meta.env.REACT_APP_DEFAULT_NODE_URL || ''
export const isTestEnv =
  (window.location.hostname.endsWith('k-f.dev') && !window.location.hostname.includes('production')) ||
  window.location.hostname === 'localhost'

const ALTAIR: EnvironmentConfig = {
  name: 'Pools on Altair',
  logo: [LogoAltair, LogoAltairText],
  network: 'altair',
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
  defaultTheme: 'dark',
  baseCurrency: 'USD',
  assetClasses: { 'Private credit': ['Art NFTs'], 'Public credit': [] },
  poolCreationType,
  useDocumentNfts: true,
  defaultPodUrl,
}

const CENTRIFUGE: EnvironmentConfig = {
  name: 'Centrifuge App',
  logo: [LogoCentrifuge, LogoCentrifugeText],
  network: 'centrifuge',
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
  defaultTheme: 'light',
  baseCurrency: 'USD',
  assetClasses: {
    'Private credit': [
      'Consumer credit',
      'Corporate credit',
      'Commercial real estate',
      'Residential real estate',
      'Project finance',
      'Trade finance',
    ],
    'Public credit': ['Corporate bonds', 'US treasuries'],
  },
  poolCreationType,
  useDocumentNfts: true,
  defaultPodUrl,
}

const ethNetwork = import.meta.env.REACT_APP_TINLAKE_NETWORK || 'mainnet'
const onfinalityKey = import.meta.env.REACT_APP_ONFINALITY_KEY

const goerliConfig = {
  rpcUrl: `https://eth-goerli.api.onfinality.io/rpc?apikey=${onfinalityKey}`,
  chainId: 5,
  poolRegistryAddress: '0x5ba1e12693dc8f9c48aad8770482f4739beed696',
  tinlakeUrl: 'https://goerli.staging.tinlake.cntrfg.com/',
  poolsHash: 'QmQe9NTiVJnVcb4srw6sBpHefhYieubR7v3J8ZriULQ8vB', // TODO: add registry to config and fetch poolHash
  blockExplorerUrl: 'https://goerli.etherscan.io',
}
const mainnetConfig = {
  rpcUrl: `https://eth.api.onfinality.io/rpc?apikey=${onfinalityKey}`,
  chainId: 1,
  poolRegistryAddress: '0x5ba1e12693dc8f9c48aad8770482f4739beed696',
  tinlakeUrl: 'https://tinlake.centrifuge.io',
  poolsHash: 'QmaMA1VYSKuuYhBcQCyf5Ek4VoiiEG6oLGp3iGbsQPGpkS', // TODO: add registry to config and fetch poolHash
  blockExplorerUrl: 'https://etherscan.io',
}

export const ethConfig = {
  network: ethNetwork,
  multicallContractAddress: '0x5ba1e12693dc8f9c48aad8770482f4739beed696', // Same for all networks
  remarkerAddress: '0x3E39db43035981c2C31F7Ffa4392f25231bE4477', // Same for all networks
  ...(ethNetwork === 'goerli' ? goerliConfig : mainnetConfig),
}

export const config = import.meta.env.REACT_APP_NETWORK === 'altair' ? ALTAIR : CENTRIFUGE

export const parachainNames: Record<number, string> = {
  1000: 'Asset Hub',
}
export const parachainIcons: Record<number, string> = {
  1000: assetHubLogo,
}

const infuraKey = import.meta.env.REACT_APP_INFURA_KEY

export const evmChains: EvmChains = {
  1: {
    name: 'Ethereum',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrl: 'https://etherscan.io/',
    urls: [`https://eth.api.onfinality.io/rpc?apikey=${onfinalityKey}`],
    iconUrl: ethereumLogo,
    isTestnet: false,
  },
  5: {
    name: 'Ethereum Goerli',
    nativeCurrency: {
      name: 'Görli Ether',
      symbol: 'görETH',
      decimals: 18,
    },
    blockExplorerUrl: 'https://goerli.etherscan.io/',
    urls: [`https://eth-goerli.api.onfinality.io/rpc?apikey=${onfinalityKey}`],
    iconUrl: goerliLogo,
    isTestnet: true,
  },
  11155111: {
    name: 'Ethereum Sepolia',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'sepETH', decimals: 18 },
    blockExplorerUrl: 'https://sepolia.etherscan.io/',
    urls: [`https://eth-sepolia.api.onfinality.io/rpc?apikey=${onfinalityKey}`],
    iconUrl: sepoliaLogo,
    isTestnet: true,
  },
  8453: {
    name: 'Base',
    nativeCurrency: { name: 'Base Ether', symbol: 'bETH', decimals: 18 },
    blockExplorerUrl: 'https://basescan.org/',
    urls: ['https://mainnet.base.org'],
    iconUrl: baseLogo,
    isTestnet: false,
  },
  84531: {
    name: 'Base Goerli',
    nativeCurrency: { name: 'Base Goerli Ether', symbol: 'gbETH', decimals: 18 },
    blockExplorerUrl: 'https://goerli.basescan.org/',
    urls: [`https://goerli.base.org`],
    iconUrl: baseLogo,
    isTestnet: true,
  },
  42161: {
    name: 'Arbitrum One',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrl: 'https://arbiscan.io/',
    urls: ['https://arb1.arbitrum.io/rpc'],
    iconUrl: arbitrumLogo,
    isTestnet: false,
  },
  421613: {
    name: 'Arbitrum Goerli',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrl: 'https://goerli.arbiscan.io/',
    urls: [`https://arbitrum-goerli.infura.io/v3/${infuraKey}`],
    iconUrl: arbitrumLogo,
    isTestnet: true,
  },
  42220: {
    name: 'Celo',
    nativeCurrency: {
      name: 'Celo',
      symbol: 'CELO',
      decimals: 18,
    },
    blockExplorerUrl: 'https://celoscan.io/',
    urls: ['https://forno.celo.org'],
    iconUrl: celoLogo,
    isTestnet: false,
  },
  44787: {
    name: 'Celo Alfajores',
    nativeCurrency: {
      name: 'Celo',
      symbol: 'CELO',
      decimals: 18,
    },
    blockExplorerUrl: 'https://alfajores.celoscan.io/',
    urls: ['https://alfajores-forno.celo-testnet.org'],
    iconUrl: celoLogo,
    isTestnet: true,
  },
}
