import { baseTheme, FabricTheme } from './tokens/baseTheme'
import { brandCentrifuge } from './tokens/brandCentrifuge'
import { modeDark } from './tokens/modeDark'

const centrifugeDark: FabricTheme = {
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    ...brandCentrifuge,
    ...modeDark.colors,
  },
}

export default centrifugeDark
