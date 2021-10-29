import { baseTheme } from './tokens/baseTheme'
import { brandAltair } from './tokens/brandAltair'
import { modeLight } from './tokens/modeLight'
import { FabricTheme } from './types'

const altairLight: FabricTheme = {
  ...baseTheme,
  colors: {
    ...brandAltair,
    ...modeLight.colors,
  },
}

export default altairLight
