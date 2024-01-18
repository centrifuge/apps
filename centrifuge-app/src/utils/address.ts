import { isAddress as isEvmAddress } from '@ethersproject/address'
import { isAddress } from '@polkadot/util-crypto'

export function isSubstrateAddress(address: string) {
  return isAddress(address) && !isEvmAddress(address)
}

export { isEvmAddress }
