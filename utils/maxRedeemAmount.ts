import { Decimal } from 'decimal.js-light';
import BN from 'bn.js';

Decimal.set({
  precision: 18
});


export const calcMaxRedeemAmount = (availableFunds:BN, tokenPrice:BN): BN => {
  const normalizedAvailableFunds = availableFunds.mul(new BN('1000000000'));
  const result = new Decimal( normalizedAvailableFunds.toString()).div(new Decimal(tokenPrice.toString()));
  return result.toString();
};
