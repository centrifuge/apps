import BN from 'bn.js'
import { Numeric } from 'decimal.js-light'
import { Dec } from './Decimal'

class BNSubType extends BN {
  static decimals: number
  static _fromNumber<T extends BNSubType = BNSubType>(number: Numeric) {
    return new (this.constructor as typeof BNSubType)(
      Dec(number).mul(Dec(10).pow(this.decimals)).toDecimalPlaces(0).toString()
    ) as T
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

export class Balance extends BNSubType {
  static decimals = 18
  static fromNumber(number: Numeric) {
    return Balance._fromNumber<Balance>(number)
  }
}

export class Price extends BNSubType {
  static decimals = 27
  static fromNumber(number: Numeric) {
    return Price._fromNumber<Price>(number)
  }
}

export class Perquintill extends BNSubType {
  static decimals = 18
  static fromNumber(number: Numeric) {
    return Perquintill._fromNumber<Perquintill>(number)
  }
  static fromPercent(number: Numeric) {
    return Perquintill.fromNumber(Dec(number).div(100))
  }
  toPercent() {
    return this.toDecimal().mul(100)
  }
}

const secondsPerYear = Dec(60 * 60 * 24 * 365)

export class Rate extends BNSubType {
  static decimals = 27
  static fromNumber(number: Numeric) {
    return Rate._fromNumber<Rate>(number)
  }
  static fromApr(apr: Numeric) {
    const i = Dec(apr)
    const rate = i.div(secondsPerYear).plus(1).mul(Dec(10).pow(this.decimals))
    return Rate.fromNumber(rate)
  }
  static fromAprPercent(apr: Numeric) {
    return this.fromApr(Dec(apr).div(100))
  }
  toPercent() {
    return this.toDecimal().mul(100)
  }
  toApr() {
    const rate = this.toDecimal()

    if (rate.isZero()) {
      return rate
    }

    const i = Dec(rate).div(Dec(10).pow(this.getDecimals())).minus(1).times(secondsPerYear)
    return i
  }
  toAprPercent() {
    this.toApr().mul(100)
  }
}
