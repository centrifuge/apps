import { baseTheme } from './tokens/baseTheme'
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
    ...baseTheme.shadows,
    cardInteractive: '0 1px 5px rgba(255, 255, 255, .8)',
    cardOverlay: `0 0 0 1px ${modeDark.colors.borderPrimary}`,
  },
}

export default altairDark
