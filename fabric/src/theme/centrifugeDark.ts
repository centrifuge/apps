import { baseTheme } from './tokens/baseTheme'
import { brandCentrifuge } from './tokens/brandCentrifuge'
import { blueScale } from './tokens/colors'
import { modeDark } from './tokens/modeDark'
import { FabricTheme } from './types'

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
    cardActive: '0 0 0 1px var(--fabric-color-focus), 0 1px 5px rgba(255, 255, 255, .8)',
    cardOverlay: '4px 8px 24px rgba(255, 255, 255, .4)',
  },
}

export default centrifugeDark
