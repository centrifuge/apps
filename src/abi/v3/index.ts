import contractAbiTitle from './Title.abi.json'
import contractAbiCurrency from './RestrictedToken.abi.json'
import contractAbiShelf from './Shelf.abi.json'
import contractAbiNavFeed from './NAVFeed.abi.json'
import contractAbiEpochCoordinator from './EpochCoordinator.abi.json'
import contractAbiMemberlist from './Memberlist.abi.json'
import contractAbiCollector from './Collector.abi.json'
import contractAbiPile from './Pile.abi.json'
import contractAbiOperator from './Operator.abi.json'
import contractAbiDistributor from './Distributor.abi.json'
import contractAbiAssessor from './Assessor.abi.json'
import contractAbiRoot from './TinlakeRoot.abi.json'
import contractAbiActions from './Actions.abi.json'
import contractAbiProxy from './Proxy.abi.json'
import contractAbiProxyRegistry from './ProxyRegistry.abi.json'
import contractAbiTranche from './Tranche.abi.json'
import contractAbiNFT from '../test/SimpleNFT.abi.json'
import { ContractAbis } from '../../Tinlake'

export default {
  COLLATERAL_NFT: contractAbiNFT,
  TITLE: contractAbiTitle,
  TINLAKE_CURRENCY: contractAbiCurrency,
  SHELF: contractAbiShelf,
  COLLECTOR: contractAbiCollector,
  FEED: contractAbiNavFeed,
  COORDINATOR: contractAbiEpochCoordinator,
  JUNIOR_MEMBER_LIST: contractAbiMemberlist,
  SENIOR_MEMBER_LIST: contractAbiMemberlist,
  PILE: contractAbiPile,
  DISTRIBUTOR: contractAbiDistributor,
  ASSESSOR: contractAbiAssessor,
  ROOT_CONTRACT: contractAbiRoot,
  JUNIOR_TOKEN: contractAbiCurrency,
  SENIOR_TOKEN: contractAbiCurrency,
  PROXY: contractAbiProxy,
  PROXY_REGISTRY: contractAbiProxyRegistry,
  ACTIONS: contractAbiActions,
  JUNIOR_OPERATOR: contractAbiOperator,
  SENIOR_OPERATOR: contractAbiOperator,
  JUNIOR_TRANCHE: contractAbiTranche,
  SENIOR_TRANCHE: contractAbiTranche,
} as ContractAbis
