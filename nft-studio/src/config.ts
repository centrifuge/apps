import { altairDark, centrifugeLight } from '@centrifuge/fabric'
import { DefaultTheme } from 'styled-components'

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
  network: 'altair' | 'centrifuge'
  themes: {
    light: DefaultTheme
    dark: DefaultTheme
  }
  defaultTheme: 'light' | 'dark'
  baseCurrency: 'Native' | 'Usd' | 'PermissionedEur'
  assetClasses: string[]
  defaultAssetClass: string
}

const ALTAIR: EnvironmentConfig = {
  name: 'Pools on Altair',
  network: 'altair',
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
  defaultTheme: 'dark',
  baseCurrency: 'Native',
  assetClasses: ['Art NFTs'],
  defaultAssetClass: 'Art NFTs',
}

const CENTRIFUGE: EnvironmentConfig = {
  name: 'Centrifuge App',
  network: 'centrifuge',
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
  defaultTheme: 'light',
  baseCurrency: 'Usd',
  assetClasses: [
    'Consumer Credit',
    'Corporate Credit',
    'Commercial Real Estate',
    'Residential Real Estate',
    'Project Finance',
  ],
  defaultAssetClass: 'Consumer Credit',
}

export const config = (import.meta.env.REACT_APP_NETWORK as 'altair' | 'centrifuge') === 'altair' ? ALTAIR : CENTRIFUGE
