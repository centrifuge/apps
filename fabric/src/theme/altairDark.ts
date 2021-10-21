import { baseShadows, baseTheme } from './tokens/baseTheme'
import { brandAltair } from './tokens/brandAltair'
import { modeDark } from './tokens/modeDark'
import { FabricTheme } from './types'

const altairDark: FabricTheme = {
  ...baseTheme,
  colors: {
    ...brandAltair,
    ...modeDark.colors,
  },
  shadows: {
    ...baseShadows,
    buttonFocused: `0 4px 12px ${brandAltair.brand}`,
  },
}

export default altairDark
