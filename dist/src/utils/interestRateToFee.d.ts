/**
 * Get fee for a specified interest rate. This function uses a lookup table for performance reasons.
 * This function uses decimal.js-light, since we need non-integer powers for our calculations here.
 * We can remove that dependency in the future if we decide to either add a hardcoded
 * lookup table for fees and interest rates or if we decide to implement the relevant
 * functions here by hand.
 * @param interestRate Interest rate in percentage points, i. e. "5" for 5 % (= 0.05)
 */
export declare const interestRateToFee: (interestRate: string) => string;
