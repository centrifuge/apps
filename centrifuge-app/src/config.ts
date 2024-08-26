import { TransactionOptions } from '@centrifuge/centrifuge-js'
import { EvmChains } from '@centrifuge/centrifuge-react'
import { centrifugeLight } from '@centrifuge/fabric'
import arbitrumLogo from '@centrifuge/fabric/assets/logos/arbitrum.svg'
import assetHubLogo from '@centrifuge/fabric/assets/logos/assethub.svg'
import baseLogo from '@centrifuge/fabric/assets/logos/base.svg'
import celoLogo from '@centrifuge/fabric/assets/logos/celo.svg'
import ethereumLogo from '@centrifuge/fabric/assets/logos/ethereum.svg'
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

type EnvironmentConfig = {
  name: string
  logo: React.ComponentType<any>[]
  network: 'altair' | 'centrifuge'
  themes: { light: DefaultTheme }
  defaultTheme: 'light' | 'dark'
  baseCurrency: 'USD'
  assetClasses: Record<'Public credit' | 'Private credit', string[]>
  poolCreationType: TransactionOptions['createType']
}

const poolCreationType = import.meta.env.REACT_APP_POOL_CREATION_TYPE || 'immediate'
export const isTestEnv =
  (window.location.hostname.endsWith('k-f.dev') && !window.location.hostname.includes('production')) ||
  window.location.hostname === 'localhost'

const ALTAIR: EnvironmentConfig = {
  name: 'Pools on Altair',
  logo: [LogoAltair, LogoAltairText],
  network: 'altair',
  themes: { light: lightTheme },
  defaultTheme: 'dark',
  baseCurrency: 'USD',
  assetClasses: { 'Private credit': ['Art NFTs'], 'Public credit': [] },
  poolCreationType,
}

const CENTRIFUGE: EnvironmentConfig = {
  name: 'Centrifuge App',
  logo: [LogoCentrifuge, LogoCentrifugeText],
  network: 'centrifuge',
  themes: {
    light: lightTheme,
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
      'Digital assets',
    ],
    'Public credit': ['Corporate bonds', 'US treasuries'],
  },
  poolCreationType,
}
const ethNetwork = import.meta.env.REACT_APP_TINLAKE_NETWORK || 'mainnet'

const alchemyKey = import.meta.env.REACT_APP_ALCHEMY_KEY

export const ethConfig = {
  rpcUrl: `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`,
  chainId: 1,
  poolRegistryAddress: '0xcA11bde05977b3631167028862bE2a173976CA11',
  tinlakeUrl: 'https://tinlake.centrifuge.io',
  poolsHash: 'QmaMA1VYSKuuYhBcQCyf5Ek4VoiiEG6oLGp3iGbsQPGpkS', // TODO: add registry to config and fetch poolHash
  blockExplorerUrl: 'https://etherscan.io',
  network: ethNetwork,
  multicallContractAddress: '0xcA11bde05977b3631167028862bE2a173976CA11', // Same for all networks
  remarkerAddress: '0x3E39db43035981c2C31F7Ffa4392f25231bE4477', // Same for all networks
}

export const config = import.meta.env.REACT_APP_NETWORK === 'altair' ? ALTAIR : CENTRIFUGE

const assetHubChainId = import.meta.env.REACT_APP_IS_DEMO ? 1001 : 1000

export const parachainNames: Record<number, string> = {
  [assetHubChainId]: 'Asset Hub',
}
export const parachainIcons: Record<number, string> = {
  [assetHubChainId]: assetHubLogo,
}

export const evmChains: EvmChains = {
  1: {
    name: 'Ethereum',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrl: 'https://etherscan.io/',
    urls: [`https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`],
    iconUrl: ethereumLogo,
    isTestnet: false,
  },
  11155111: {
    name: 'Ethereum Sepolia',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'sepETH', decimals: 18 },
    blockExplorerUrl: 'https://sepolia.etherscan.io/',
    urls: [`https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`],
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
  84532: {
    name: 'Base Sepolia',
    nativeCurrency: { name: 'Base Sepolia Ether', symbol: 'sbETH', decimals: 18 },
    blockExplorerUrl: 'https://sepolia.basescan.org/',
    urls: [`https://sepolia.base.org`],
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

export const feeCategories = ['Trading', 'Fund admin', 'Custodian', 'Investor onboarding', 'Auditor']
