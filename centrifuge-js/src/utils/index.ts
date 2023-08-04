import { u8aToHex } from '@polkadot/util'
import { addressEq, createKeyMulti, decodeAddress, sortAddresses } from '@polkadot/util-crypto'
import { hash } from '@stablelib/blake2b'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import { ComputedMultisig, Multisig } from '../types'
import { Dec } from './Decimal'

const LoanPalletAccountId = '0x6d6f646c70616c2f6c6f616e0000000000000000000000000000000000000000'

const secondsPerYear = Dec(60 * 60 * 24 * 365)
const percentFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
})

export function getRandomUint() {
  return (Math.random() * (2 ** 53 - 1)) >>> 0
}

export function toPerquintill(rate: number) {
  return new BN(rate * 10 ** 6).mul(new BN(10).pow(new BN(18 - 6))).toString()
}

export function aprToFee(apr: number) {
  const i = Dec(apr)
  const fee = i.div(secondsPerYear).plus(1).mul('1e27').toDecimalPlaces(0)
  return fee.toString()
}

export function feeToApr(fee: string | BN) {
  let feeToConvert = fee
  if (typeof feeToConvert !== 'string' && typeof feeToConvert !== 'number') {
    feeToConvert = feeToConvert.toString()
  }

  if (feeToConvert.toString() === '0') {
    return feeToConvert.toString()
  }

  const i = Dec(feeToConvert).div('1e27').minus(1).times(secondsPerYear)
  return i.mul(100).toDecimalPlaces(2).toString()
}

export function baseToDisplay(base: string | BN, decimals: number): string {
  let baseStr = typeof base === 'string' ? base : base.toString()
  const neg = baseStr.includes('-')

  baseStr = baseStr.replace(/-/g, '')

  const a = baseStr.slice(0, -decimals) || '0'
  const b = baseStr.slice(-decimals).padStart(decimals, '0')

  const res = `${a}.${b}`

  return neg ? `-${res}` : res
}

export function toPrecision(value: string, precision: number) {
  const zero = Dec('0').toFixed(precision)
  const result = Dec(value.toString()).toFixed(precision)

  // If value >= 0.0 but will be rounded to 0.0, round up.
  // Otherwise, 183542 base units as precision 18 will be rounded to 0.00.
  if (zero === result) return Dec(value.toString()).toFixed(precision, Decimal.ROUND_UP)

  return result
}

// regex from https://stackoverflow.com/a/2901298/6694848
export function addThousandsSeparators(x: string | BN | number) {
  const parts = x.toString().split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

export function formatCurrencyAmount(bn: BN | string | undefined, currency?: string, precise?: boolean) {
  // TODO: get currency based on env
  const currencyStr = currency === 'native' ? 'AIR' : currency || 'kusd'
  if (!bn) return ''
  return `${addThousandsSeparators(toPrecision(baseToDisplay(new BN(bn), 18), precise ? 4 : 0))} ${currencyStr}`
}

export function formatPercentage(numerator: BN | string | undefined, denominator: BN | string | undefined) {
  if (!numerator || !denominator) return ''
  const a = new BN(numerator).div(new BN(1e6))
  let b = new BN(denominator).div(new BN(1e6))
  b = b.isZero() ? new BN(1) : b
  const percentage = (parseInt(a.toString(), 10) / parseInt(b.toString(), 10)) * 100
  return `${percentFormatter.format(percentage)}%`
}

export function formatRatio(ratio: BN | undefined) {
  if (!ratio) return ''
  return `${addThousandsSeparators(toPrecision(baseToDisplay(ratio || '0', 27), 4))}`
}

export function isSameAddress(a?: string | Uint8Array, b?: string | Uint8Array) {
  if (!a || !b) return false
  if (a === b) return true
  return addressEq(a, b)
}

export function isLoanPalletAccount(address?: string | Uint8Array) {
  return isSameAddress(address, LoanPalletAccountId)
}

export function getDateYearsFromNow(years: number) {
  return new Date(new Date().setFullYear(new Date().getFullYear() + years))
}

export function getDateMonthsFromNow(month: number) {
  const date = new Date()
  return new Date(date.setMonth(date.getMonth() + month))
}

export function addressToHex(addr: string) {
  return u8aToHex(decodeAddress(addr))
}

export function computeTrancheId(trancheIndex: number, poolId: string) {
  const a = new BN(trancheIndex).toArray('le', 8)
  const b = new BN(poolId).toArray('le', 8)
  const data = Uint8Array.from(a.concat(b))

  return u8aToHex(hash(data, 16))
}

// Computes multisig address and sorts signers
export function computeMultisig(multisig: Multisig): ComputedMultisig {
  const address = u8aToHex(createKeyMulti(multisig.signers, multisig.threshold))
  return {
    address,
    signers: sortAddresses(multisig.signers).map(addressToHex),
    threshold: multisig.threshold,
  }
}

export function evmToSubstrateAddress(address: string, chainId: number) {
  // Bytes EVM\0 as suffix
  const suffix = '45564d00'
  const chainHex = chainId.toString(16).padStart(4, '0')

  return `0x${address.substring(2).toLowerCase()}000000000000${chainHex}${suffix}`
}
