import { addressEq, encodeAddress } from '@polkadot/util-crypto'

const { REACT_APP_WHITELISTED_ACCOUNTS: whitelistConfig } = import.meta.env

const whitelistedAccounts = whitelistConfig
  ? (whitelistConfig as string).split(',').map((a) => {
      try {
        return encodeAddress(a)
      } catch (e) {
        return ''
      }
    })
  : []

export function isWhitelistedAccount(address: string) {
  if (!whitelistedAccounts.length) return true
  const addr = encodeAddress(address)
  return whitelistedAccounts.includes(addr)
}

export function truncateAddress(address: string) {
  const encodedAddress = encodeAddress(address, 2)
  const first = encodedAddress.slice(0, 5)
  const last = encodedAddress.slice(-5)

  return `${first}...${last}`
}

export function isSameAddress(a?: string | Uint8Array, b?: string | Uint8Array) {
  if (!a || !b) return false
  if (a === b) return true
  return addressEq(a, b)
}
