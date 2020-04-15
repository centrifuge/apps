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
  contractAddresses: ContractAddresses;
  nftDataOutputs: AbiOutput;
  transactionTimeout: number;
  contractAbis?: ContractAbis |{};
  ethConfig?: EthConfig | {};
  ethOptions?: any | {};
  contracts?: Contracts | {};
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

  constructor(params: TinlakeParams) {
    const { provider, contractAddresses, nftDataOutputs, transactionTimeout, contractAbis, ethOptions, ethConfig } = params;
    if (!contractAbis) {
      contractNames.forEach((name) => {
        if (abiDefinitions[name]) {
          this.contractAbis[name] = abiDefinitions[name];
        }
      });
    } else {
      this.contractAbis = contractAbis;
    }

    nftDataOutputs && (this.contractAbis['COLLATERAL_NFT_DATA'][0].outputs = nftDataOutputs);
    this.contractAddresses = contractAddresses;
    this.transactionTimeout = transactionTimeout;
    this.setProvider(provider, ethOptions);
    this.setEthConfig(ethConfig || {});
  }

  setProvider = (provider: any, ethOptions?: any) => {
    this.provider = provider;
    this.ethOptions = ethOptions || {};
    this.eth = new Eth(this.provider, this.ethOptions) as ethI;

    contractNames.forEach((name) => {
      if (this.contractAbis[name] && this.contractAddresses[name]) {
        this.contracts[name] = this.eth.contract(this.contractAbis[name])
        .at(this.contractAddresses[name]);
      }
    });
  }

  setEthConfig = (ethConfig: EthConfig | {}) => {
    this.ethConfig = ethConfig;
  }

}
