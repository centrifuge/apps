import breakpoints from './breakpoints'
import colors from './colors'
import space from './space'
import typography from './typography'

export const theme = {
  breakpoints,
  typography,
  space,
  colors,
  fonts: {
    standard:
      "AvenirNextLTW01, 'Avenir Next', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
  },
}

export type FabricTheme = typeof theme
