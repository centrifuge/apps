import { Decimal } from 'decimal.js-light'
import BN from 'bn.js'

Decimal.set({
  precision: 30,
  toExpNeg: -7,
  toExpPos: 29,
})

export const calcRatioPercent = (a: BN, b: BN): string => {
  const _a = new Decimal(a.toString())
  const _b = new Decimal(b.toString())

  return _a
    .div(_b)
    .mul(100)
    .toFixed(2)
}
