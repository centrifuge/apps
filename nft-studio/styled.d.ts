import { FabricTheme } from '@centrifuge/fabric'
import {} from 'styled-components'

declare module 'styled-components' {
  export interface DefaultTheme extends FabricTheme {
    sizes: FabricTheme['sizes'] & {
      navBarHeight: number
      navBarHeightMobile: number
    }
  }
}
