import Decimal, { Numeric } from 'decimal.js-light'

Decimal.set({
  precision: 28,
  toExpNeg: -7,
  toExpPos: 29,
  rounding: Decimal.ROUND_HALF_CEIL,
})

console.log('Decimal.config', Decimal.config)

export function Dec(value: Numeric) {
  return new Decimal(value)
}
