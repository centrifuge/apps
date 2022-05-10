import { baseTheme } from './tokens/baseTheme'
import { brandCentrifuge } from './tokens/brandCentrifuge'
import { modeDark } from './tokens/modeDark'
import { FabricTheme } from './types'

const blueScale = {
  30: '#FAFBFF',
  50: '#F0F4FF',
  100: '#DBE5FF',
  200: '#B3C8FF',
  300: '#7A9FFF',
  400: '#4C7EFF',
  500: '#1253FF',
  600: '#003CDB',
  700: '#002B9E',
  800: '#001C66',
}

export const centrifugeDark: FabricTheme = {
  ...baseTheme,
  scheme: 'dark',
  colors: {
    ...brandCentrifuge,
    ...modeDark.colors,
    primarySelectedBackground: blueScale[500],
    secondarySelectedBackground: blueScale[700],
    borderFocus: blueScale[500],
    borderSelected: blueScale[500],
    textSelected: blueScale[400],
    textInteractive: blueScale[400],
    textInteractiveHover: blueScale[400],
    accentScale: blueScale,
  },
  shadows: {
    ...baseTheme.shadows,
    cardInteractive: '0 1px 5px rgba(255, 255, 255, .8)',
    cardOverlay: `0 0 0 1px ${modeDark.colors.borderPrimary}`,
  },
}

export default centrifugeDark
