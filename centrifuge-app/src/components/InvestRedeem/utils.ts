import Decimal from 'decimal.js-light'
import { Dec } from '../../utils/Decimal'

export function inputToNumber(num: number | Decimal | '') {
  return num instanceof Decimal ? num.toNumber() : num || 0
}

export function inputToDecimal(num: number | Decimal | string) {
  return Dec(num || 0)
}

export function validateNumberInput(value: number | string | Decimal, min: number | Decimal, max?: number | Decimal) {
  if (value === '' || value == null) {
    return 'Not a valid number'
  }
  if (max && Dec(value).greaterThan(Dec(max))) {
    return 'Value too large'
  }
  if (Dec(value).lessThan(Dec(min))) {
    return 'Value too small'
  }
}
