import { baseTheme } from './tokens/baseTheme'
import { brandCentrifuge } from './tokens/brandCentrifuge'
import { modeDark } from './tokens/modeDark'
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

export const centrifugeDark: FabricTheme = {
  ...baseTheme,
  scheme: 'dark',
  colors: {
    ...brandCentrifuge,
    ...modeDark.colors,
    primarySelectedBackground: blueScale.blue500,
    secondarySelectedBackground: blueScale.blue700,
    borderFocus: blueScale.blue500,
    borderSelected: blueScale.blue500,
    textSelected: blueScale.blue400,
    textInteractive: blueScale.blue400,
    textInteractiveHover: blueScale.blue400,
  },
  shadows: {
    ...baseTheme.shadows,
    cardInteractive: '0 1px 5px rgba(255, 255, 255, .8)',
    cardOverlay: `0 0 0 1px ${modeDark.colors.borderPrimary}`,
  },
}

export default centrifugeDark
