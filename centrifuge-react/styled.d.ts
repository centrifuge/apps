import {} from 'styled-components'
import { FabricTheme } from './src/theme'

declare module 'styled-components' {
  export interface DefaultTheme extends FabricTheme {}
}
