import Decimal, { Numeric } from 'decimal.js-light'

Decimal.set({
  precision: 30,
  toExpNeg: -7,
  toExpPos: 29,
  rounding: Decimal.ROUND_HALF_CEIL,
})

export function Dec(value: Numeric) {
  return new Decimal(value)
}

export function min(...nums: Decimal[]) {
  return nums.reduce((a, b) => (a.greaterThan(b) ? b : a))
}
