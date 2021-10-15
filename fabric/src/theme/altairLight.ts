import { baseTheme, FabricTheme } from './tokens/baseTheme'
import { brandColors } from './tokens/brandColors'
import { modeLight } from './tokens/modeLight'

const altairLight: FabricTheme = {
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    ...brandColors.altair,
    ...modeLight.colors,
  },
  shadows: {
    ...baseTheme.shadows,
    buttonFocused: `0 4px 12px ${brandColors.altair.brand}`,
  },
}

export default altairLight
