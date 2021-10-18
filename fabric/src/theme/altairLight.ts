import { baseTheme, FabricTheme } from './tokens/baseTheme'
import { brandAltair } from './tokens/brandAltair'
import { modeLight } from './tokens/modeLight'

const altairLight: FabricTheme = {
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    ...brandAltair,
    ...modeLight.colors,
  },
  shadows: {
    ...baseTheme.shadows,
    buttonFocused: `0 4px 12px ${brandAltair.brand}`,
  },
}

export default altairLight
