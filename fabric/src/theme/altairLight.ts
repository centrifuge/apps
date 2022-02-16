import { baseTheme } from './tokens/baseTheme'
import { brandAltair } from './tokens/brandAltair'
import { modeLight } from './tokens/modeLight'
import { FabricTheme } from './types'

const altairLight: FabricTheme = {
  ...baseTheme,
  scheme: 'light',
  colors: {
    ...brandAltair,
    ...modeLight.colors,
  },
}

export default altairLight
