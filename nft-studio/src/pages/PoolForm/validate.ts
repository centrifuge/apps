import { combine, pattern, required } from '../../utils/validation'

const numWith2Decimals = pattern(/^\d+(\.\d{1,2})?$/, 'Please insert a number with up to 2 decimals')

export const validate = {
  poolName: required(),
  maxReserve: required(),
  // tranche data
  tokenName: required(),
  symbolName: required(),
  interestRate: combine(required(), numWith2Decimals),
  minRiskBuffer: combine(required(), numWith2Decimals),
}
