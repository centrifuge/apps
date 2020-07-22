import { Decimal } from 'decimal.js-light'
import BN from 'bn.js'

Decimal.set({
  precision: 30,
  toExpNeg: -7,
  toExpPos: 29,
})

const bufferInSeconds = 60 * 60

/**
 * Adds a fee buffer of 5 minutes to the debt. This function can be used to calculate
 * the amount that should be approved for repayment of debt. Since interest in tinlake
 * accrues every second, we need to allow for a small buffer for repaying debt.
 * @param debt
 * @param fee
 */
export const calcRepayAmount = (debt: BN, fee: BN): BN => {
  const _debt = new Decimal(debt.toString())
  const _fee = new Decimal(fee.toString()).div(1e27)

  const _feeFactor = _fee.pow(bufferInSeconds)
  const _buffer = _debt.mul(_feeFactor.minus(1))
  const _repayAmount = _debt.plus(_buffer)

  return new BN(_repayAmount.toFixed(0))
}
