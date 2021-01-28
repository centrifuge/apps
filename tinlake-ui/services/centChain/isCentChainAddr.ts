import { Keyring } from '@polkadot/api'

export function isCentChainAddr(addr: string) {
  const keyring = new Keyring()
  const accountId = keyring.decodeAddress(addr, true)
  let accountId2: Uint8Array
  try {
    accountId2 = keyring.decodeAddress(addr, false, 36)
  } catch (e) {
    return false
  }
  return accountId.every((b, i) => b === accountId2[i])
}
