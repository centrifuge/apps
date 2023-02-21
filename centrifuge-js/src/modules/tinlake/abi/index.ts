import contractAbiOperator from './Operator.abi.json'
import contractAbiCurrency from './RestrictedToken.abi.json'
import contractAbiTranche from './Tranche.abi.json'

export const abis = {
  TINLAKE_CURRENCY: contractAbiCurrency,
  JUNIOR_TOKEN: contractAbiCurrency,
  SENIOR_TOKEN: contractAbiCurrency,
  JUNIOR_TRANCHE: contractAbiTranche,
  SENIOR_TRANCHE: contractAbiTranche,
  JUNIOR_OPERATOR: contractAbiOperator,
  SENIOR_OPERATOR: contractAbiOperator,
}
