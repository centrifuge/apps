import Decimal from 'decimal.js-light'

export const toPrecision = (value: string, precision: number) => {
  const zero = new Decimal('0').toFixed(precision)
  const result = new Decimal(value.toString()).toFixed(precision)

  // If value >= 0.0 but will be rounded to 0.0, round up.
  // Otherwise, 183542 base units as precision 18 will be rounded to 0.00.
  if (zero === result) return new Decimal(value.toString()).toFixed(precision, Decimal.ROUND_UP)

  return result
}
