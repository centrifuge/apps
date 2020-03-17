import contractAbiTitle from './Title.abi.json';
import contractAbiNFT from './test/SimpleNFT.abi.json';
import contractAbiCurrency from './test/SimpleToken.abi.json';
import contractAbiShelf from './Shelf.abi.json';
import contractAbiCeiling from './Principal.abi.json';
import contractAbiCollector from './Collector.abi.json';
import contractAbiThreshold from './PushRegistry.abi.json';
import contractAbiPricePool from './PricePool.abi.json';
import contractAbiPile from './Pile.abi.json';
import contractAbiOperator from './AllowanceOperator.abi.json';
import contractAbiDistributor from './DefaultDistributor.abi.json';
import contractAbiAssessor from './DefaultAssessor.abi.json';
import contractAbiRoot from './Root.abi.json';
import contractAbiTranche from './Tranche.abi.json';
import contractAbiNFTData from './NftData.abi.json';

import { ContractAbis } from '../types';

export default {
  COLLATERAL_NFT : contractAbiNFT,
  COLLATERAL_NFT_DATA: contractAbiNFTData,
  TITLE : contractAbiTitle,
  TINLAKE_CURRENCY : contractAbiCurrency,
  SHELF : contractAbiShelf,
  CEILING : contractAbiCeiling,
  COLLECTOR : contractAbiCollector,
  THRESHOLD : contractAbiThreshold,
  PRICE_POOL : contractAbiPricePool,
  PILE: contractAbiPile,
  DISTRIBUTOR : contractAbiDistributor,
  ASSESSOR: contractAbiAssessor,
  ROOT_CONTRACT: contractAbiRoot,
  JUNIOR_TOKEN: contractAbiCurrency,
  JUNIOR_OPERATOR : contractAbiOperator,
  JUNIOR: contractAbiTranche,
  SENIOR: contractAbiTranche,
  SENIOR_TOKEN: contractAbiCurrency,
} as ContractAbis;
