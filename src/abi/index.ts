
import contractAbiTitle from './Title.abi.json';
import contractAbiCurrency from './test/SimpleToken.abi.json';
import contractAbiShelf from './Shelf.abi.json';
import contractAbiNftFeed from './NftFeed.abi.json';
import contractAbiCollector from './Collector.abi.json';
import contractAbiPricePool from './PricePool.abi.json';
import contractAbiPile from './Pile.abi.json';
import contractAbiAllowanceOperator from './AllowanceOperator.abi.json';
import contractAbiProportionalOperator from './ProportionalOperator.abi.json';
import contractAbiDistributor from './DefaultDistributor.abi.json';
import contractAbiAssessor from './DefaultAssessor.abi.json';
import contractAbiRoot from './Root.abi.json';
import contractAbiActions from './Actions.abi.json';
import contractAbiProxy from './Proxy.abi.json';
import contractAbiProxyRegistry from './ProxyRegistry.abi.json';
import contractAbiTranche from './Tranche.abi.json';
import contractAbiSeniorTranche from './SeniorTranche.abi.json';
import contractAbiNFTData from './NftData.abi.json';
import contractAbiNFT from './test/SimpleNFT.abi.json';
import contractAbiBorrowerDeployer from './BorrowerDeployer.abi.json';
import contractAbiLenderDeployer from './LenderDeployer.abi.json';
import { ContractAbis } from '../Tinlake';

export default {
  // COLLATERAL_NFT : contractAbiTitle,
  COLLATERAL_NFT : contractAbiNFT,
  COLLATERAL_NFT_DATA: contractAbiNFTData,
  TITLE : contractAbiTitle,
  TINLAKE_CURRENCY : contractAbiCurrency,
  SHELF : contractAbiShelf,
  CEILING : contractAbiNftFeed,
  COLLECTOR : contractAbiCollector,
  THRESHOLD : contractAbiNftFeed,
  PRICE_POOL : contractAbiPricePool,
  PILE: contractAbiPile,
  DISTRIBUTOR : contractAbiDistributor,
  ASSESSOR: contractAbiAssessor,
  ROOT_CONTRACT: contractAbiRoot,
  JUNIOR_TOKEN: contractAbiCurrency,
  SENIOR_TOKEN: contractAbiCurrency,
  PROXY: contractAbiProxy,
  PROXY_REGISTRY: contractAbiProxyRegistry,
  ACTIONS: contractAbiActions,
  ALLOWANCE_OPERATOR : contractAbiAllowanceOperator,
  PROPORTIONAL_OPERATOR : contractAbiProportionalOperator,
  JUNIOR: contractAbiTranche,
  SENIOR: contractAbiSeniorTranche,
  BORROWER_DEPLOYER: contractAbiBorrowerDeployer,
  LENDER_DEPLOYER: contractAbiLenderDeployer,
} as ContractAbis;
