import { baseColors } from './baseColors'
import { brandCentrifuge } from './brandCentrifuge'
import { breakpoints } from './breakpoints'
import { modeLight } from './modeLight'
import { space } from './space'
import { typography } from './typography'

export const baseTheme = {
  breakpoints,
  typography,
  space,
  colors: {
    ...baseColors,
    ...brandCentrifuge,
    ...modeLight.colors,
  },
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
  shadows: {
    cardInteractive: '0 1px 5px rgba(0, 0, 0, 0.2)',
    buttonFocused: `0 4px 12px ${brandCentrifuge.brand}`,
  },
}

export type FabricTheme = typeof baseTheme
