import { baseShadows, baseTheme } from './tokens/baseTheme'
import { brandAltair } from './tokens/brandAltair'
import { modeLight } from './tokens/modeLight'
import { FabricTheme } from './types'

const altairLight: FabricTheme = {
  ...baseTheme,
  colors: {
    ...brandAltair,
    ...modeLight.colors,
  },
  shadows: {
    ...baseShadows,
    buttonFocused: `0 4px 12px ${brandAltair.brand}`,
  },
}

export default altairLight
