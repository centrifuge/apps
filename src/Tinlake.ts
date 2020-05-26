import Eth from 'ethjs';
import { ethI, executeAndRetry, ZERO_ADDRESS }  from './services/ethereum';
import  abiDefinitions  from './abi';

const contractNames = [
  'TINLAKE_CURRENCY',
  'JUNIOR_OPERATOR',
  'JUNIOR',
  'JUNIOR_TOKEN',
  'SENIOR',
  'SENIOR_TOKEN',
  'SENIOR_OPERATOR',
  'DISTRIBUTOR',
  'ASSESSOR',
  'TITLE',
  'PILE',
  'SHELF',
  'CEILING',
  'COLLECTOR',
  'THRESHOLD',
  'PRICE_POOL',
  'COLLATERAL_NFT',
  'COLLATERAL_NFT_DATA',
  'ROOT_CONTRACT',
  'PROXY',
  'PROXY_REGISTRY',
  'ACTIONS',
  'BORROWER_DEPLOYER',
  'LENDER_DEPLOYER',
  'NFT_FEED',
];

type AbiOutput = {
  name: string;
  type: 'address' | 'uint256';
};

export type EthConfig = {
  from: string;
  gasLimit: string;
};

export type ContractNames = typeof contractNames[number];

export type Contracts = {
  [key in ContractNames]?: any;
};

export type ContractAbis = {
  [key in ContractNames]?: any;
};

export type ContractAddresses = {
  [key in ContractNames]?: string;
};

export type TinlakeParams = {
  provider: any;
  transactionTimeout: number;
  contractAddresses?: ContractAddresses | {};
  contractAbis?: ContractAbis | {};
  ethConfig?: EthConfig | {};
  ethOptions?: any | {};
  contracts?: Contracts | {};
  contractConfig?: any | {};
};

export type Constructor<T = {}> = new (...args: any[]) => Tinlake;

export default class Tinlake {
  public provider: any;
  public eth: ethI;
  public ethOptions: any;
  public ethConfig: EthConfig | {};
  public contractAddresses: ContractAddresses;
  public transactionTimeout: number;
  public contracts: Contracts = {};
  public contractAbis: ContractAbis = {};
  public contractConfig: any = {};

  constructor(params: TinlakeParams) {
    const { provider, contractAddresses, transactionTimeout, contractAbis, ethOptions, ethConfig, contractConfig } = params;
    if (!contractAbis) {
      this.contractAbis = abiDefinitions;
    }

    this.contractConfig = contractConfig || {};
    this.contractAddresses = contractAddresses || {};
    this.transactionTimeout = transactionTimeout;
    this.setProvider(provider, ethOptions);
    this.setEthConfig(ethConfig || {});
  }

  setProvider = (provider: any, ethOptions?: any) => {
    this.provider = provider;
    this.ethOptions = ethOptions || {};
    this.eth = new Eth(this.provider, this.ethOptions) as ethI;

    this.setContracts();
  }

  setContracts = () => {
    // set root & proxy contracts
    contractNames.forEach((name) => {
      if (this.contractAbis[name] && this.contractAddresses[name]) {
        this.contracts[name] = this.eth.contract(this.contractAbis[name])
        .at(this.contractAddresses[name]);
      }
    });

    // modular contracts
    if (this.contractAddresses['JUNIOR_OPERATOR']) {
      this.contracts['JUNIOR_OPERATOR'] = this.contractConfig['JUNIOR_OPERATOR']
                  ? this.createContract(this.contractAddresses['JUNIOR_OPERATOR'], this.contractConfig['JUNIOR_OPERATOR'])
                  : this.createContract(this.contractAddresses['JUNIOR_OPERATOR'], 'ALLOWANCE_OPERATOR');
    }
    if (this.contractAddresses['SENIOR_OPERATOR']) {
      this.contracts['SENIOR_OPERATOR'] = this.contractConfig['SENIOR_OPERATOR']
                  ? this.createContract(this.contractAddresses['SENIOR_OPERATOR'], this.contractConfig['SENIOR_OPERATOR'])
                  : this.createContract(this.contractAddresses['SENIOR_OPERATOR'], 'ALLOWANCE_OPERATOR');
    }
  }

  setEthConfig = (ethConfig: EthConfig | {}) => {
    this.ethConfig = ethConfig;
  }

  // retrieves contract addresses based on the root address provided
  setContractAddresses = async () => {

    // retrieve borrower & lender deployer addresses
    const [
      lenderDeployerRes,
      borrowerDeployerRes,
    ] = await Promise.all([
      executeAndRetry(this.contracts['ROOT_CONTRACT'].lenderDeployer, []),
      executeAndRetry(this.contracts['ROOT_CONTRACT'].borrowerDeployer, []),
    ]);

    this.contractAddresses['LENDER_DEPLOYER'] = lenderDeployerRes[0];
    this.contractAddresses['BORROWER_DEPLOYER'] = borrowerDeployerRes[0];
    const lenderDeployer: any = this.eth.contract(this.contractAbis['LENDER_DEPLOYER']).at(this.contractAddresses['LENDER_DEPLOYER']);
    const borrowerDeployer: any = this.eth.contract(this.contractAbis['BORROWER_DEPLOYER']).at(this.contractAddresses['BORROWER_DEPLOYER']);

    const [
      shelfRes,
      nftFeedRes,
      collectorRes,
      thresholdRes,
      pricePoolRes,

      juniorOperatorRes,
      seniorOperatorRes,
    ] = await Promise.all([

      // retrieve borrower addresses & create contracts
      executeAndRetry(borrowerDeployer.shelf, []),
      executeAndRetry(borrowerDeployer.nftFeed, []),
      executeAndRetry(borrowerDeployer.collector, []),
      executeAndRetry(borrowerDeployer.threshold, []),
      executeAndRetry(borrowerDeployer.pricePool, []),

      // retrieve lender addresses & create contract
      executeAndRetry(lenderDeployer.juniorOperator, []),
      executeAndRetry(lenderDeployer.seniorOperator, []),
    ]);

    // set borrower addresses & create contracts
    if (!this.contractAddresses['SHELF']) {
      this.contractAddresses['SHELF'] = shelfRes[0];
    }
    this.contracts['SHELF'] = this.eth.contract(this.contractAbis['SHELF']).at(this.contractAddresses['SHELF']);

    if (!this.contractAddresses['NFT_FEED']) {
      this.contractAddresses['NFT_FEED'] = nftFeedRes[0];
    }
    this.contracts['NFT_FEED'] = this.eth.contract(this.contractAbis['NFT_FEED']).at(this.contractAddresses['NFT_FEED']);

    if (!this.contractAddresses['COLLECTOR'])  {
      this.contractAddresses['COLLECTOR'] = collectorRes[0];
    }this.contracts['COLLECTOR'] = this.eth.contract(this.contractAbis['COLLECTOR']).at(this.contractAddresses['COLLECTOR']);


    if (!this.contractAddresses['THRESHOLD'])  {
      this.contractAddresses['THRESHOLD'] = thresholdRes[0];
    }
    this.contracts['THRESHOLD'] = this.eth.contract(this.contractAbis['THRESHOLD']).at(this.contractAddresses['THRESHOLD']);

    if (!this.contractAddresses['PRICE_POOL']) {
      this.contractAddresses['PRICE_POOL'] = pricePoolRes[0];
    }
    this.contracts['PRICE_POOL'] = this.eth.contract(this.contractAbis['PRICE_POOL']).at(this.contractAddresses['PRICE_POOL']);

    // set lender addresses & create contract
    if (!this.contractAddresses['JUNIOR_OPERATOR']) {
      this.contractAddresses['JUNIOR_OPERATOR'] = juniorOperatorRes[0];
    }
      this.contracts['JUNIOR_OPERATOR'] = this.contractAddresses['JUNIOR_OPERATOR'] && (this.contractConfig['JUNIOR_OPERATOR']
                            ? this.createContract(this.contractAddresses['JUNIOR_OPERATOR'], this.contractConfig['JUNIOR_OPERATOR'])
                            : this.createContract(this.contractAddresses['JUNIOR_OPERATOR'], 'ALLOWANCE_OPERATOR'));

    const [
      titleRes,
      ceilingRes,
      pileRes,
      tinlakeCurrencyRes,
      distributorRes,

      juniorRes,
      assessorRes,
      // seniorOperatorRes,
    ] = await Promise.all([

      // use shelf to retrieve borrower side addresses for this deployment
      executeAndRetry(this.contracts['SHELF'].title, []),
      executeAndRetry(this.contracts['SHELF'].ceiling, []),
      executeAndRetry(this.contracts['SHELF'].pile, []),
      executeAndRetry(this.contracts['SHELF'].currency, []),
      executeAndRetry(this.contracts['SHELF'].distributor, []),

      // use tranche operators to retrieve retrieve lender side addresses for this deployment (if possible)

      executeAndRetry(this.contracts['JUNIOR_OPERATOR'].tranche, []),
      executeAndRetry(this.contracts['JUNIOR_OPERATOR'].assessor, []),
    ]);

    // use shelf to retrieve borrower side addresses for this deployment
    this.contractAddresses['TITLE'] = titleRes[0];
    this.contracts['TITLE'] = this.eth.contract(this.contractAbis['TITLE']).at(this.contractAddresses['TITLE']);
    this.contractAddresses['CEILING'] = ceilingRes[0];
    this.contracts['CEILING'] = this.eth.contract(this.contractAbis['CEILING']).at(this.contractAddresses['CEILING']);
    this.contractAddresses['PILE'] = pileRes[0];
    this.contracts['PILE'] = this.eth.contract(this.contractAbis['PILE']).at(this.contractAddresses['PILE']);
    this.contractAddresses['TINLAKE_CURRENCY']  = tinlakeCurrencyRes[0];
    this.contracts['TINLAKE_CURRENCY'] = this.eth.contract(this.contractAbis['TINLAKE_CURRENCY']).at(this.contractAddresses['TINLAKE_CURRENCY']);
    this.contractAddresses['DISTRIBUTOR']  = distributorRes[0];
    this.contracts['DISTRIBUTOR'] = this.eth.contract(this.contractAbis['DISTRIBUTOR']).at(this.contractAddresses['DISTRIBUTOR']);

    // use tranche operators to retrieve retrieve lender side addresses for this deployment (if possible)
    this.contractAddresses['JUNIOR'] = juniorRes[0];
    this.contracts['JUNIOR'] = this.eth.contract(this.contractAbis['JUNIOR']).at(this.contractAddresses['JUNIOR']);
    this.contractAddresses['JUNIOR_TOKEN'] = (await executeAndRetry(this.contracts['JUNIOR'].token, []))[0];
    this.contracts['JUNIOR_TOKEN'] = this.eth.contract(this.contractAbis['JUNIOR_TOKEN']).at(this.contractAddresses['JUNIOR_TOKEN']);
    this.contractAddresses['ASSESSOR'] = assessorRes[0];
    this.contracts['ASSESSOR'] = this.eth.contract(this.contractAbis['ASSESSOR']).at(this.contractAddresses['ASSESSOR']);

    // make sure senior tranche exists
    if (!this.contractAddresses['SENIOR_OPERATOR']) {
      this.contractAddresses['SENIOR_OPERATOR'] = seniorOperatorRes[0];
    }

    if (this.contractAddresses['SENIOR_OPERATOR'] !== ZERO_ADDRESS) {
      this.contracts['SENIOR_OPERATOR'] = this.contractAddresses['SENIOR_OPERATOR'] && (this.contractConfig['SENIOR_OPERATOR']
      ? this.createContract(this.contractAddresses['SENIOR_OPERATOR'], this.contractConfig['SENIOR_OPERATOR'])
      : this.createContract(this.contractAddresses['SENIOR_OPERATOR'], 'ALLOWANCE_OPERATOR'));
      this.contractAddresses['SENIOR'] = (await executeAndRetry(this.contracts['SENIOR_OPERATOR'].tranche, []))[0];
      this.contracts['SENIOR'] = this.eth.contract(this.contractAbis['SENIOR']).at(this.contractAddresses['SENIOR']);
      this.contractAddresses['SENIOR_TOKEN'] = (await executeAndRetry(this.contracts['SENIOR'].token, []))[0];
      this.contracts['SENIOR_TOKEN'] = this.eth.contract(this.contractAbis['SENIOR_TOKEN']).at(this.contractAddresses['SENIOR_TOKEN']);
    } else {
      this.contractAddresses['SENIOR'] = ZERO_ADDRESS;
      this.contractAddresses['SENIOR_TOKEN'] = ZERO_ADDRESS;
    }
  }

  createContract(address: string, abiName: string) {
    const contract = this.eth.contract(this.contractAbis[abiName]).at(address);
    return contract;
  }

  getOperatorType = (tranche: string) => {
    switch (tranche) {
      case 'senior':
        return this.contractConfig['SENIOR_OPERATOR'] || 'ALLOWANCE_OPERATOR';
      case 'junior':
        return this.contractConfig['SENIOR_OPERATOR'] || 'ALLOWANCE_OPERATOR';
      default:
        return 'ALLOWANCE_OPERATOR';
    }
  }

}
