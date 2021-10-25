import { baseShadows, baseTheme } from './tokens/baseTheme'
import { brandCentrifuge } from './tokens/brandCentrifuge'
import { modeLight } from './tokens/modeLight'
import { FabricTheme } from './types'

const centrifugeLight: FabricTheme = {
  ...baseTheme,
  colors: {
    ...brandCentrifuge,
    ...modeLight.colors,
  },
  shadows: {
    ...baseShadows,
    buttonFocused: `0 4px 12px ${brandCentrifuge.brand}`,
  },
}

export default centrifugeLight
