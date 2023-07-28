import contractAbiAssessor from './Assessor.abi.json'
import contractAbiClaimCFG from './ClaimCFG.abi.json'
import contractAbiCoordinator from './EpochCoordinator.abi.json'
import contractAbiFeed from './NAVFeed.abi.json'
import contractAbiFeed2 from './NAVFeed_V2.abi.json'
import contractAbiFeed3 from './NAVFeed_V3.abi.json'
import contractAbiOperator from './Operator.abi.json'
import contractAbiReserve from './Reserve.abi.json'
import contractAbiCurrency from './RestrictedToken.abi.json'
import contractAbiTranche from './Tranche.abi.json'

export const abis = {
  TINLAKE_CURRENCY: contractAbiCurrency,
  JUNIOR_TOKEN: contractAbiCurrency,
  SENIOR_TOKEN: contractAbiCurrency,
  COORDINATOR: contractAbiCoordinator,
  FEED: contractAbiFeed,
  FEED_V2: contractAbiFeed2,
  FEED_V3: contractAbiFeed3,
  JUNIOR_OPERATOR: contractAbiOperator,
  SENIOR_OPERATOR: contractAbiOperator,
  ASSESSOR: contractAbiAssessor,
  JUNIOR_TRANCHE: contractAbiTranche,
  SENIOR_TRANCHE: contractAbiTranche,
  RESERVE: contractAbiReserve,
  CLAIM_CFG: contractAbiClaimCFG,
}
