import { FabricTheme } from '../types'
import { breakpoints } from './breakpoints'
import { space } from './space'
import { typography } from './typography'

export const baseTheme: Omit<FabricTheme, 'colors' | 'shadows'> = {
  breakpoints,
  typography,
  space,
  sizes: {
    container: 1152,
    iconSmall: 16,
    iconMedium: 24,
  },
  radii: {
    card: 8,
  },
  fonts: {
    standard:
      "AvenirNextLTW01, 'Avenir Next', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
  },
}

export const baseShadows = {
  cardInteractive: '0 1px 5px rgba(0, 0, 0, 0.2)',
}
