import { FabricTheme } from '@centrifuge/fabric'
import { ThemeTypography } from '@centrifuge/fabric/dist/theme'
import {} from 'styled-components'

declare module 'styled-components' {
  export interface DefaultTheme extends FabricTheme {
    sizes: FabricTheme['sizes'] & {
      mainContent: number
    }
    colors: FabricTheme['color'] & {
      placeholderBackground: string
    }
    typography: FabricTheme['typography'] & {
      headingLarge: ThemeTypography['heading1']
    }
  }
}
