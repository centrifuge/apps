import { baseTheme } from './tokens/baseTheme'
import { brandAltair } from './tokens/brandAltair'
import { modeLight } from './tokens/modeLight'
import { FabricTheme } from './types'

const blueScale = {
  blue30: '#FAFBFF',
  blue50: '#F0F4FF',
  blue100: '#DBE5FF',
  blue200: '#B3C8FF',
  blue300: '#7A9FFF',
  blue400: '#4C7EFF',
  blue500: '#1253FF',
  blue600: '#003CDB',
  blue700: '#002B9E',
  blue800: '#001C66',
}

export const altairLight: FabricTheme = {
  ...baseTheme,
  scheme: 'light',
  colors: {
    ...brandAltair,
    ...modeLight.colors,
    primarySelectedBackground: blueScale.blue500,
    secondarySelectedBackground: blueScale.blue50,
    borderFocus: blueScale.blue500,
    borderSelected: blueScale.blue500,
    textSelected: blueScale.blue500,
    textInteractive: blueScale.blue500,
    textInteractiveHover: blueScale.blue500,
  },
}

export default altairLight
