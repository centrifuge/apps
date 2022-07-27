import { Keyring } from '@polkadot/api'

export function accountIdToCentChainAddr(accountId: string) {
  const keyring = new Keyring()
  const addr = keyring.encodeAddress(accountId, 36)
  return addr
}
