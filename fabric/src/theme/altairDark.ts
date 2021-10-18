import { baseTheme, FabricTheme } from './tokens/baseTheme'
import { brandAltair } from './tokens/brandAltair'
import { modeDark } from './tokens/modeDark'

const altairDark: FabricTheme = {
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    ...brandAltair,
    ...modeDark.colors,
  },
  shadows: {
    ...baseTheme.shadows,
    buttonFocused: `0 4px 12px ${brandAltair.brand}`,
  },
}

export default altairDark
