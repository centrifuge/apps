import { baseTheme } from './tokens/baseTheme'
import { brandAltair } from './tokens/brandAltair'
import { yellowScale } from './tokens/colors'
import { modeDark } from './tokens/modeDark'
import { FabricTheme } from './types'

export const altairDark: FabricTheme = {
  ...baseTheme,
  scheme: 'dark',
  colors: {
    ...brandAltair,
    ...modeDark.colors,
    primarySelectedBackground: yellowScale[500],
    secondarySelectedBackground: yellowScale[700],
    borderFocus: yellowScale[500],
    borderSelected: yellowScale[500],
    textSelected: yellowScale[500],
    textInteractive: yellowScale[500],
    textInteractiveHover: yellowScale[500],
    accentScale: yellowScale,
  },
  shadows: {
    ...baseTheme.shadows,
    cardInteractive: '0 1px 5px rgba(255, 255, 255, .8)',
    cardActive: ' 0 0 0 1px var(--fabric-color-focus), 0 1px 5px rgba(255, 255, 255, .8)',
    cardOverlay: `0 0 0 1px ${modeDark.colors.borderPrimary}`,
  },
}

export default altairDark
