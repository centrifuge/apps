import { baseTheme } from './tokens/baseTheme'
import { brandCentrifuge } from './tokens/brandCentrifuge'
import { modeDark } from './tokens/modeDark'
import { FabricTheme } from './types'

const centrifugeDark: FabricTheme = {
  ...baseTheme,
  colors: {
    ...brandCentrifuge,
    ...modeDark.colors,
  },
}

export default centrifugeDark
