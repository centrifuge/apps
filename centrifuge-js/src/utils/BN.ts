import { Codec } from '@polkadot/types-codec/types'
import BN from 'bn.js'
import { Numeric } from 'decimal.js-light'
import { Dec } from './Decimal'

class BNSubType extends BN {
  static decimals: number
  static _fromFloat<T extends BNSubType = BNSubType>(number: Numeric) {
    const n = Dec(number).mul(Dec(10).pow(this.decimals)).toDecimalPlaces(0).toString()
    return new (this as typeof BNSubType)(n) as T
  }
  constructor(number: number | string | number[] | Uint8Array | Buffer | BN) {
    super(BN.isBN(number) ? number.toString() : number)
  }
  getDecimals() {
    return (this.constructor as typeof BNSubType).decimals
  }
  toDecimal() {
    return Dec(this.toString()).div(Dec(10).pow(this.getDecimals()))
  }
  toFloat() {
    return this.toDecimal().toNumber()
  }
}

export class CurrencyBalance extends BN {
  decimals: number
  constructor(number: number | string | number[] | Uint8Array | Buffer | BN | Codec, decimals: number) {
    super(
      typeof number === 'object' && 'toPrimitive' in number
        ? number.toString()
        : BN.isBN(number)
        ? number.toString()
        : number
    )
    this.decimals = decimals
  }
  static fromFloat(number: Numeric, decimals: number) {
    const n = Dec(number).mul(Dec(10).pow(decimals)).toDecimalPlaces(0).toString()
    return new CurrencyBalance(n, decimals)
  }
  toDecimal() {
    return Dec(this.toString()).div(Dec(10).pow(this.decimals))
  }
  toFloat() {
    return this.toDecimal().toNumber()
  }
}

export class TokenBalance extends CurrencyBalance {
  static fromFloat(number: Numeric, decimals: number) {
    const n = Dec(number).mul(Dec(10).pow(decimals)).toDecimalPlaces(0).toString()
    return new TokenBalance(n, decimals)
  }
}

export class Price extends BNSubType {
  static decimals = 18
  static fromFloat(number: Numeric) {
    return Price._fromFloat<Price>(number)
  }
  toDecimal() {
    return Dec(this.toString()).div(Dec(10).pow(Price.decimals))
  }
  toFloat() {
    return this.toDecimal().toNumber()
  }
}

export class Perquintill extends BNSubType {
  static decimals = 18
  static fromFloat(number: Numeric) {
    return Perquintill._fromFloat<Perquintill>(number)
  }
  static fromPercent(number: Numeric) {
    return Perquintill.fromFloat(Dec(number).div(100))
  }
  toPercent() {
    return this.toDecimal().mul(100)
  }
}

const secondsPerYear = Dec(60 * 60 * 24 * 365)

export class Rate extends BNSubType {
  static decimals = 27
  static fromFloat(number: Numeric) {
    return Rate._fromFloat<Rate>(number)
  }
  static fromPercent(number: Numeric) {
    return Rate.fromFloat(Dec(number).div(100))
  }
  static fromApr(apr: Numeric) {
    const i = Dec(apr)
    const rate = i.div(secondsPerYear).plus(1)
    return Rate.fromFloat(rate)
  }
  static fromAprPercent(apr: Numeric) {
    return this.fromApr(Dec(apr).div(100))
  }
  static fractionFromApr(apr: Numeric) {
    const i = Dec(apr)
    const rate = i.div(secondsPerYear)
    return Rate.fromFloat(rate)
  }
  static fractionFromAprPercent(apr: Numeric) {
    return this.fractionFromApr(Dec(apr).div(100))
  }
  toPercent() {
    return this.toDecimal().mul(100)
  }
  toApr() {
    const rate = this.toDecimal()

    if (rate.isZero()) {
      return rate
    }

    const i = rate.minus(1).times(secondsPerYear)
    return i
  }
  toAprPercent() {
    return this.toApr().mul(100)
  }
  fractionToApr() {
    const rate = this.toDecimal()

    if (rate.isZero()) {
      return rate
    }

    const i = rate.times(secondsPerYear)
    return i
  }
  fractionToAprPercent() {
    return this.fractionToApr().mul(100)
  }
}
