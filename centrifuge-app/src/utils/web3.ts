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

export function truncate(string: string, frontCount?: number, endCount?: number) {
  const first = string.slice(0, frontCount ?? 5)
  const last = string.slice(endCount ? -endCount : -5)
  return `${first}...${last}`
}

export function isSameAddress(a?: string | Uint8Array, b?: string | Uint8Array) {
  if (!a || !b) return false
  if (a === b) return true
  return addressEq(a, b)
}
