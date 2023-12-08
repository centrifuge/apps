import { baseTheme } from './tokens/baseTheme'
import { brandAltair } from './tokens/brandAltair'
import { blueScale, grayScale, yellowScale } from './tokens/colors'
import { modeLight } from './tokens/modeLight'
import { FabricTheme } from './types'

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
    blueScale,
    yellowScale,
    grayScale,
  },
}

export default altairLight
