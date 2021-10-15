import { baseTheme, FabricTheme } from './tokens/baseTheme'
import { brandColors } from './tokens/brandColors'
import { modes } from './tokens/modes'

export const centrifugeDark: FabricTheme = {
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    ...brandColors.centrifuge,
    ...modes.dark.colors,
  },
}
