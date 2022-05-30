import { baseTheme } from './tokens/baseTheme'
import { brandAltair } from './tokens/brandAltair'
import { blueScale } from './tokens/colors'
import { modeDark } from './tokens/modeDark'
import { FabricTheme } from './types'

export const altairDark: FabricTheme = {
  ...baseTheme,
  scheme: 'dark',
  colors: {
    ...brandAltair,
    ...modeDark.colors,
    primarySelectedBackground: blueScale[500],
    secondarySelectedBackground: blueScale[700],
    borderFocus: blueScale[500],
    borderSelected: blueScale[500],
    textSelected: blueScale[500],
    textInteractive: blueScale[500],
    textInteractiveHover: blueScale[500],
    accentScale: blueScale,
  },
  shadows: {
    ...baseTheme.shadows,
    cardInteractive: '0 1px 5px rgba(255, 255, 255, .8)',
    cardActive: ' 0 0 0 1px var(--fabric-color-focus), 0 1px 5px rgba(255, 255, 255, .8)',
    cardOverlay: `0 0 0 1px ${modeDark.colors.borderPrimary}`,
  },
}

export default altairDark
