import breakpoints from './breakpoints'
import colors from './colors'
import space from './space'
import typography from './typography'

export type ColorMode = 'light' | 'dark'

export const theme = {
  breakpoints,
  typography,
  space,
  colors,
  sizes: {
    container: 1152,
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
    buttonFocused: `0 4px 12px ${colors.brand}`,
  },
}

export function getTheme(colorMode: 'light' | 'dark') {
  return {
    ...theme,
    colors: {
      ...theme.colors,
      ...theme.colors.modes[colorMode],
    },
  }
}

export type FabricTheme = typeof theme
