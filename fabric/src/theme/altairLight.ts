import { baseTheme } from './tokens/baseTheme'
import { brandAltair } from './tokens/brandAltair'
import { modeLight } from './tokens/modeLight'
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

export const altairLight: FabricTheme = {
  ...baseTheme,
  scheme: 'light',
  colors: {
    ...brandAltair,
    ...modeLight.colors,
    primarySelectedBackground: blueScale[500],
    secondarySelectedBackground: blueScale[50],
    borderFocus: blueScale[500],
    borderSelected: blueScale[500],
    textSelected: blueScale[500],
    textInteractive: blueScale[500],
    textInteractiveHover: blueScale[500],
    accentScale: blueScale,
  },
}

export default altairLight
