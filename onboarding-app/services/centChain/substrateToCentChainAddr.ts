import { Keyring } from '@polkadot/api'

export function substrateToCentChainAddr(addr: string) {
  const keyring = new Keyring()
  const accountId = keyring.decodeAddress(addr, false)
  const centChainAddr = keyring.encodeAddress(accountId, 36)
  return centChainAddr
}
