import { encodeAddress } from '@polkadot/util-crypto'

export function truncateAddress(address: string) {
  const encodedAddress = encodeAddress(address, 2)
  const first8 = encodedAddress.slice(0, 8)
  const last3 = encodedAddress.slice(-3)

  return `${first8}...${last3}`
}
