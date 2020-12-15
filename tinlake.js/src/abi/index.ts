import { ContractAbis } from '../Tinlake'
import contractAbiActions from './Actions.abi.json'
import contractAbiAssessor from './Assessor.abi.json'
import contractAbiAssessorAdmin from './AssessorAdmin.abi.json'
import contractAbiCollector from './Collector.abi.json'
import contractAbiDistributor from './Distributor.abi.json'
import contractAbiEpochCoordinator from './EpochCoordinator.abi.json'
import contractAbiMemberlist from './Memberlist.abi.json'
import contractAbiNavFeed from './NAVFeed.abi.json'
import contractAbiOperator from './Operator.abi.json'
import contractAbiPile from './Pile.abi.json'
import contractAbiPoolRegistry from './PoolRegistry.abi.json'
import contractAbiProxy from './Proxy.abi.json'
import contractAbiProxyRegistry from './ProxyRegistry.abi.json'
import contractAbiReserve from './Reserve.abi.json'
import contractAbiCurrency from './RestrictedToken.abi.json'
import contractAbiShelf from './Shelf.abi.json'
import contractAbiNFT from './test/SimpleNFT.abi.json'
import contractAbiRoot from './TinlakeRoot.abi.json'
import contractAbiTitle from './Title.abi.json'
import contractAbiTranche from './Tranche.abi.json'

export default {
  COLLATERAL_NFT: contractAbiNFT,
  TITLE: contractAbiTitle,
  TINLAKE_CURRENCY: contractAbiCurrency,
  SHELF: contractAbiShelf,
  COLLECTOR: contractAbiCollector,
  FEED: contractAbiNavFeed,
  COORDINATOR: contractAbiEpochCoordinator,
  JUNIOR_MEMBERLIST: contractAbiMemberlist,
  SENIOR_MEMBERLIST: contractAbiMemberlist,
  PILE: contractAbiPile,
  DISTRIBUTOR: contractAbiDistributor,
  ASSESSOR: contractAbiAssessor,
  ASSESSOR_ADMIN: contractAbiAssessorAdmin,
  ROOT_CONTRACT: contractAbiRoot,
  JUNIOR_TOKEN: contractAbiCurrency,
  SENIOR_TOKEN: contractAbiCurrency,
  PROXY: contractAbiProxy,
  PROXY_REGISTRY: contractAbiProxyRegistry,
  ACTIONS: contractAbiActions,
  RESERVE: contractAbiReserve,
  JUNIOR_OPERATOR: contractAbiOperator,
  SENIOR_OPERATOR: contractAbiOperator,
  JUNIOR_TRANCHE: contractAbiTranche,
  SENIOR_TRANCHE: contractAbiTranche,
  POOL_REGISTRY: contractAbiPoolRegistry,
} as ContractAbis
