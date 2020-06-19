import Eth from 'ethjs';
import { ethI }  from './services/ethereum';
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
  'GOVERNANCE',
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
