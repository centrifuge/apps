import * as React from 'react'
import { Logo } from './SelectButton'
import type { State } from './types'
import { useNetworkIcon } from './utils'

export type NetworkIconProps = {
  network: Exclude<State['walletDialog']['network'], null>
  size?: string | number
  disabled?: boolean
}

export function NetworkIcon({ network, size = 'iconRegular' }: NetworkIconProps) {
  return <Logo icon={useNetworkIcon(network)} size={size} />
}
