declare module '@centrifuge/axis-theme'
declare module '@centrifuge/axis-spinner'
declare module '@centrifuge/axis-display-field'
declare module '@centrifuge/axis-modal'
declare module '@centrifuge/axis-ratio-bar'
declare module '@centrifuge/axis-token-input'
declare module '@centrifuge/axis-tooltip'
declare module '@centrifuge/axis-utils'
declare module '@centrifuge/tinlake-pools-kovan'
declare module '@centrifuge/tinlake-pools-mainnet'
declare module 'ethjs'
declare module 'ethereum-blockies'
declare module 'web3-utils'
declare module '@makerdao/multicall'
declare module 'react-twitter-embed'

import 'styled-components'
import { Theme } from './theme'

declare module 'styled-components' {
  export interface DefaultTheme extends Theme {}
}
