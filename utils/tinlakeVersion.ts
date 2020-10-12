import { ITinlake } from '@centrifuge/tinlake-js'
import { ITinlake as ITinlakeV3 } from '@centrifuge/tinlake-js-v3'

export function isTinlakeV2(tinlake: ITinlake | ITinlakeV3): tinlake is ITinlake {
  return (tinlake as ITinlake).version === undefined || (tinlake as ITinlake).version === 2
}

export function isTinlakeV3(tinlake: ITinlake | ITinlakeV3): tinlake is ITinlakeV3 {
  return (tinlake as ITinlakeV3).version === 3
}
