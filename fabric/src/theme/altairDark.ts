import { baseTheme, FabricTheme } from './tokens/baseTheme'
import { brandColors } from './tokens/brandColors'
import { modes } from './tokens/modes'

export const altairDark: FabricTheme = {
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    ...brandColors.altair,
    ...modes.dark.colors,
  },
  shadows: {
    ...baseTheme.shadows,
    buttonFocused: `0 4px 12px ${brandColors.altair.brand}`,
  },
}
