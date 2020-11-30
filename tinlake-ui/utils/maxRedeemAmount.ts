import BN from 'bn.js'
import { Decimal } from 'decimal.js-light'

Decimal.set({
  precision: 18,
})

export const calcMaxRedeemAmount = (availableFunds: BN, tokenPrice: BN): string => {
  const normalizedAvailableFunds = availableFunds.mul(new BN('1000000000'))
  const result = new Decimal(normalizedAvailableFunds.toString()).div(new Decimal(tokenPrice.toString()))
  return result.toString()
}
