import { baseTheme } from './tokens/baseTheme'
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
    ...baseTheme.shadows,
    cardInteractive: '0 1px 5px rgba(255, 255, 255, .8)',
    cardOverlay: `0 0 0 1px ${modeDark.colors.borderPrimary}`,
  },
}

export default centrifugeDark
