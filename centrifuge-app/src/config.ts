import { TransactionOptions } from '@centrifuge/centrifuge-js'
import { LoanInfo } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { altairDark, centrifugeLight } from '@centrifuge/fabric'
import React from 'react'
import { DefaultTheme } from 'styled-components'
import { LogoAltairText } from './components/LogoAltair'
import { LogoCentrifuge } from './components/LogoCentrifuge'

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
  logo: React.ComponentType<any>
  network: 'altair' | 'centrifuge'
  themes: {
    light: DefaultTheme
    dark: DefaultTheme
  }
  defaultTheme: 'light' | 'dark'
  baseCurrency: 'Native' | 'kUsd' | 'PermissionedEur'
  assetClasses: string[]
  defaultAssetClass: string
  tokensPageSubtitle: string
  defaultLoanType: LoanInfo['type']
  poolCreationType: TransactionOptions['createType']
  useDocumentNfts: boolean
  defaultPodUrl: string
}

const poolCreationType: TransactionOptions['createType'] = import.meta.env.REACT_APP_POOL_CREATION_TYPE || 'immediate'
const defaultPodUrl: string = import.meta.env.REACT_APP_DEFAULT_NODE_URL || ''

const ALTAIR: EnvironmentConfig = {
  name: 'Pools on Altair',
  logo: LogoAltairText,
  network: 'altair',
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
  defaultTheme: 'dark',
  baseCurrency: 'Native',
  assetClasses: ['Art NFTs'],
  defaultAssetClass: 'Art NFTs',
  tokensPageSubtitle: 'Art NFTs',
  defaultLoanType: 'CreditLineWithMaturity',
  poolCreationType,
  useDocumentNfts: false,
  defaultPodUrl,
}

const CENTRIFUGE: EnvironmentConfig = {
  name: 'Centrifuge App',
  logo: LogoCentrifuge,
  network: 'centrifuge',
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
  defaultTheme: 'light',
  baseCurrency: 'kUsd',
  assetClasses: [
    'Consumer Credit',
    'Corporate Credit',
    'Commercial Real Estate',
    'Residential Real Estate',
    'Project Finance',
  ],
  defaultAssetClass: 'Consumer Credit',
  tokensPageSubtitle: 'Tokens of real-world assets',
  defaultLoanType: 'CreditLineWithMaturity',
  poolCreationType,
  useDocumentNfts: true,
  defaultPodUrl,
}

export const config = (import.meta.env.REACT_APP_NETWORK as 'altair' | 'centrifuge') === 'altair' ? ALTAIR : CENTRIFUGE
