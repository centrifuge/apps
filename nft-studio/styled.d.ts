import { FabricTheme } from '@centrifuge/fabric'
import { ThemeTypography } from '@centrifuge/fabric/dist/theme'
import {} from 'styled-components'

declare module 'styled-components' {
  export interface DefaultTheme extends FabricTheme {
    sizes: FabricTheme['sizes'] & {
      navBarHeight: number
      navBarHeightMobile: number
      dialog: number
    }
    typography: FabricTheme['typography'] & {
      headingLarge: ThemeTypography['heading1']
    }
  }
}
