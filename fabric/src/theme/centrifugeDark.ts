import { baseTheme, FabricTheme } from './tokens/baseTheme'
import { brandColors } from './tokens/brandColors'
import { modeDark } from './tokens/modeDark'

const centrifugeDark: FabricTheme = {
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    ...brandColors.centrifuge,
    ...modeDark.colors,
  },
}

export default centrifugeDark
