import { Decimal } from 'decimal.js-light';
import BN from 'bn.js';

Decimal.set({
  precision: 28,
  toExpNeg: -7,
  toExpPos: 29,
  rounding: Decimal.ROUND_HALF_CEIL,
});

const n = new Decimal(60 * 60 * 24 * 365);

const lookup: { [fee: string]: string } = {};

/**
 * Get interest rate in percentage points for a specified fee.
 * This function uses a lookup table for performance reasons.
 * This function uses decimal.js-light, since we need non-integer powers for our calculations here.
 * We can remove that dependency in the future if we decide to either add a hardcoded
 * lookup table for fees and interest rates or if we decide to implement the relevant
 * functions here by hand.
 * @param fee Fee
 */
export const feeToInterestRate = (fee: string|BN): string => {
  let feeToConvert = fee;
  if (typeof feeToConvert !== 'string' && typeof feeToConvert !== 'number') { feeToConvert = feeToConvert.toString(); }

  if (feeToConvert.toString() === '0') { return feeToConvert.toString(); }

  if (lookup[feeToConvert]) { return lookup[feeToConvert]; }

  const i = new Decimal(feeToConvert).div('1e27').minus(1).times(n);

  const interestRate = i.mul(100).toDecimalPlaces(1);

  const interestRateString = interestRate.toString();

  lookup[feeToConvert] = interestRateString;

  return interestRateString;
};
