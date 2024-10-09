import { baseTheme } from './tokens/baseTheme'
import { brandCentrifuge } from './tokens/brandCentrifuge'
import { blueScale, grayScale, yellowScale } from './tokens/colors'
import { colorTheme } from './tokens/theme'
import { FabricTheme } from './types'

export const centrifugeTheme: FabricTheme = {
  ...baseTheme,
  scheme: 'light',
  colors: {
    ...brandCentrifuge,
    ...colorTheme.colors,
    primarySelectedBackground: yellowScale[500],
    secondarySelectedBackground: yellowScale[50],
    focus: grayScale[600],
    borderFocus: grayScale[500],
    borderSelected: grayScale[500],
    textSelected: grayScale[500],
    textInteractive: grayScale[500],
    textInteractiveHover: grayScale[500],
    accentScale: yellowScale,
    blueScale,
    yellowScale,
    grayScale,
  },
}

export default centrifugeTheme
