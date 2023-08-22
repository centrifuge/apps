import { TransactionOptions } from '@centrifuge/centrifuge-js'
import { altairDark, centrifugeLight } from '@centrifuge/fabric'
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
  assetClasses: string[]
  defaultAssetClass: string
  poolCreationType: TransactionOptions['createType']
  useDocumentNfts: boolean
  defaultPodUrl: string
}

const poolCreationType = import.meta.env.REACT_APP_POOL_CREATION_TYPE || 'immediate'
const defaultPodUrl = import.meta.env.REACT_APP_DEFAULT_NODE_URL || ''

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
  assetClasses: ['Art NFTs'],
  defaultAssetClass: 'Art NFTs',
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
  assetClasses: [
    'Consumer Credit',
    'Corporate Credit',
    'Commercial Real Estate',
    'Residential Real Estate',
    'Project Finance',
    'Trade Finance',
    'US Treasuries',
  ],
  defaultAssetClass: 'Consumer Credit',
  poolCreationType,
  useDocumentNfts: true,
  defaultPodUrl,
}

const ethNetwork = import.meta.env.REACT_APP_TINLAKE_NETWORK || 'mainnet'

const goerliConfig = {
  rpcUrl: 'https://goerli.infura.io/v3/f9ba987e8cb34418bb53cdbd4d8321b5',
  poolRegistryAddress: '0x5ba1e12693dc8f9c48aad8770482f4739beed696',
  tinlakeUrl: 'https://goerli.staging.tinlake.cntrfg.com/',
  poolsHash: 'QmQe9NTiVJnVcb4srw6sBpHefhYieubR7v3J8ZriULQ8vB', // TODO: add registry to config and fetch poolHash
  blockExplorerUrl: 'https://goerli.etherscan.io',
}
const mainnetConfig = {
  rpcUrl: 'https://mainnet.infura.io/v3/ed5e0e19bcbc427cbf8f661736d44516',
  poolRegistryAddress: '0x5ba1e12693dc8f9c48aad8770482f4739beed696',
  tinlakeUrl: 'https://tinlake.centrifuge.io',
  poolsHash: 'QmNvauf8E6TkUiyF1ZgtYtntHz335tCswKp2uhBH1fiui1', // TODO: add registry to config and fetch poolHash
  blockExplorerUrl: 'https://etherscan.io',
}

export const ethConfig = {
  network: ethNetwork,
  multicallContractAddress: '0x5ba1e12693dc8f9c48aad8770482f4739beed696', // Same for all networks
  remarkerAddress: '0x3E39db43035981c2C31F7Ffa4392f25231bE4477', // Same for all networks
  ...(ethNetwork === 'goerli' ? goerliConfig : mainnetConfig),
}

export const config = import.meta.env.REACT_APP_NETWORK === 'altair' ? ALTAIR : CENTRIFUGE
