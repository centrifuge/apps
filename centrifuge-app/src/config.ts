import { TransactionOptions } from '@centrifuge/centrifuge-js'
import { LoanInfo } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { altairDark, centrifugeLight } from '@centrifuge/fabric'
import React from 'react'
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
  baseCurrency: 'AUSD'
  assetClasses: string[]
  defaultAssetClass: string
  defaultLoanType: LoanInfo['type']
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
  baseCurrency: 'AUSD',
  assetClasses: ['Art NFTs'],
  defaultAssetClass: 'Art NFTs',
  defaultLoanType: 'CreditLineWithMaturity',
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
  baseCurrency: 'AUSD',
  assetClasses: [
    'Consumer Credit',
    'Corporate Credit',
    'Commercial Real Estate',
    'Residential Real Estate',
    'Project Finance',
  ],
  defaultAssetClass: 'Consumer Credit',
  defaultLoanType: 'CreditLineWithMaturity',
  poolCreationType,
  useDocumentNfts: true,
  defaultPodUrl,
}

const ethNetwork = import.meta.env.REACT_APP_TINLAKE_NETWORK || 'goerli'

const goerliConfig = {
  rpcUrl: 'https://goerli.infura.io/v3/f9ba987e8cb34418bb53cdbd4d8321b5',
  poolRegistryAddress: '0x5ba1e12693dc8f9c48aad8770482f4739beed696',
}
const mainnetConfig = {
  rpcUrl: 'https://mainnet.infura.io/v3/ed5e0e19bcbc427cbf8f661736d44516',
  poolRegistryAddress: '0x5ba1e12693dc8f9c48aad8770482f4739beed696',
}

export const ethConfig = {
  poolsHash: import.meta.env.REACT_APP_TINLAKE_POOLS_HASH || 'QmYY9GPHZ19A75S1UUQCiY1ckxchaJdRpESpkRvZTVDBPM',
  network: ethNetwork,
  multicallContractAddress: '0x5ba1e12693dc8f9c48aad8770482f4739beed696', // Same for all networks
  ...(ethNetwork === 'goerli' ? goerliConfig : mainnetConfig),
}

export const config = import.meta.env.REACT_APP_NETWORK === 'altair' ? ALTAIR : CENTRIFUGE
