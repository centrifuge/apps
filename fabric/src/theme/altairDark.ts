import { baseTheme } from './tokens/baseTheme'
import { brandAltair } from './tokens/brandAltair'
import { modeDark } from './tokens/modeDark'
import { FabricTheme } from './types'

const yellowScale = {
  yellow500: '#FFC012',
  yellow700: '#574000',
}

export const altairDark: FabricTheme = {
  ...baseTheme,
  scheme: 'dark',
  colors: {
    ...brandAltair,
    ...modeDark.colors,
    primarySelectedBackground: yellowScale.yellow500,
    secondarySelectedBackground: yellowScale.yellow700,
    borderFocus: yellowScale.yellow500,
    borderSelected: yellowScale.yellow500,
    textSelected: yellowScale.yellow500,
    textInteractive: yellowScale.yellow500,
    textInteractiveHover: yellowScale.yellow500,
  },
  shadows: {
    ...baseTheme.shadows,
    cardInteractive: '0 1px 5px rgba(255, 255, 255, .8)',
    cardOverlay: `0 0 0 1px ${modeDark.colors.borderPrimary}`,
  },
}

export default altairDark
