import { isAddress } from '@polkadot/util-crypto'
import { isAddress as isEvmAddress } from 'ethers'

export function isSubstrateAddress(address: string) {
  return isAddress(address) && !isEvmAddress(address)
}

export { isEvmAddress }
