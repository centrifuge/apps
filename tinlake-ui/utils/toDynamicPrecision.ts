import Decimal from 'decimal.js-light'
import { toPrecision } from './toPrecision'

/**
 * Returns a number rounded to 4 decimals if the value is smaller than 10, and to 0 decimlas otherwise.
 * @param num amount with a decimal dot, not in base units
 */
export const toDynamicPrecision = (num: string) => toPrecision(num, dynamicPrecision(num))

/**
 * Returns the number of decimals the value should receive, being 4 decimals if the value is smaller than 10, and to 0
 * decimlas otherwise.
 * @param num amount with a decimal dot, not in base units
 */
export const dynamicPrecision = (num: string) => (new Decimal(num).lt(10) ? 4 : 0)
