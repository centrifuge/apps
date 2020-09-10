import contractAbiTitle from './Title.abi'
import contractAbiCurrency from './RestrictedToken.abi'
import contractAbiShelf from './Shelf.abi'
import contractAbiNavFeed from './NAVFeed.abi'
import contractAbiCoordinator from './EpochCoordinator.abi'
import contractAbiMemberlist from './Memberlist.abi'
import contractAbiCollector from './Collector.abi'
import contractAbiPile from './Pile.abi'
import contractAbiOperator from './Operator.abi'
import contractAbiDistributor from './Distributor.abi'
import contractAbiAssessor from './Assessor.abi'
import contractAbiRoot from './TinlakeRoot.abi'
import contractAbiActions from './Actions.abi'
import contractAbiProxy from './Proxy.abi'
import contractAbiProxyRegistry from './ProxyRegistry.abi'
import contractAbiTranche from './Tranche.abi'
import contractAbiNFT from '../test/SimpleNFT.abi.json'
import { ContractAbis } from '../../Tinlake'

export default {
  COLLATERAL_NFT: contractAbiNFT,
  TITLE: contractAbiTitle,
  TINLAKE_CURRENCY: contractAbiCurrency,
  SHELF: contractAbiShelf,
  COLLECTOR: contractAbiCollector,
  NAV_FEED: contractAbiNavFeed,
  COORDINATOR: contractAbiCoordinator,
  MEMBER_LIST: contractAbiMemberlist,
  PILE: contractAbiPile,
  DISTRIBUTOR: contractAbiDistributor,
  ASSESSOR: contractAbiAssessor,
  ROOT_CONTRACT: contractAbiRoot,
  JUNIOR_TOKEN: contractAbiCurrency,
  SENIOR_TOKEN: contractAbiCurrency,
  PROXY: contractAbiProxy,
  PROXY_REGISTRY: contractAbiProxyRegistry,
  ACTIONS: contractAbiActions,
  OPERATOR: contractAbiOperator,
  JUNIOR: contractAbiTranche,
  SENIOR: contractAbiTranche,
} as ContractAbis
