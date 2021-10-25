import { baseShadows, baseTheme } from './tokens/baseTheme'
import { brandCentrifuge } from './tokens/brandCentrifuge'
import { modeDark } from './tokens/modeDark'
import { FabricTheme } from './types'

const centrifugeDark: FabricTheme = {
  ...baseTheme,
  colors: {
    ...brandCentrifuge,
    ...modeDark.colors,
  },
  shadows: {
    ...baseShadows,
    buttonFocused: `0 4px 12px ${brandCentrifuge.brand}`,
  },
}

export default centrifugeDark
