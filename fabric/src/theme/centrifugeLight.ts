import { baseTheme } from './tokens/baseTheme'
import { brandCentrifuge } from './tokens/brandCentrifuge'
import { modeLight } from './tokens/modeLight'
import { FabricTheme } from './types'

const centrifugeLight: FabricTheme = {
  ...baseTheme,
  scheme: 'light',
  colors: {
    ...brandCentrifuge,
    ...modeLight.colors,
  },
}

export default centrifugeLight
