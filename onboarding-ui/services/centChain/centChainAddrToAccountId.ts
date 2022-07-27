import { Keyring } from '@polkadot/api'

export function centChainAddrToAccountId(addr: string) {
  const keyring = new Keyring()
  const accountId = keyring.decodeAddress(addr, false, 36)
  const hex = `0x${Buffer.from(accountId).toString('hex')}`
  return hex
}
