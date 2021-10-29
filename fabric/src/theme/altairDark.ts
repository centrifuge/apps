import { baseTheme } from './tokens/baseTheme'
import { brandAltair } from './tokens/brandAltair'
import { modeDark } from './tokens/modeDark'
import { FabricTheme } from './types'

const altairDark: FabricTheme = {
  ...baseTheme,
  colors: {
    ...brandAltair,
    ...modeDark.colors,
  },
}

export default altairDark
