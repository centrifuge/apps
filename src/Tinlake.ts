import Eth from 'ethjs';
import { ethI }  from './services/ethereum';
import  abiDefinitions  from './abi';
import { ethers } from 'ethers';
import BN from 'bn.js';

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

export type PendingTransaction = {
  hash: string
  contractKey: string
  timesOutAt?: number,
};

export type EthConfig = {
  from?: string;
  gasPrice?: string;
  gas?: string;
};

export type EthersOverrides = {
  gasPrice?: number;
  gasLimit?: number;
};

export type EthersConfig = {
  provider: ethers.providers.Provider
  signer: ethers.Signer,
  overrides?: EthersOverrides,
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
  ethConfig?: EthConfig;
  ethersConfig?: EthersConfig;
  ethOptions?: any | {};
  contracts?: Contracts | {};
  contractConfig?: any | {};
};

export type Constructor<T = {}> = new (...args: any[]) => Tinlake;

(ethers.utils.BigNumber as any).prototype.toBN = function () {
  return new BN((this as any).toString());
};

export default class Tinlake {
  public provider: any;
  public eth: ethI;
  public ethOptions: any;
  public ethConfig: EthConfig;
  public ethersConfig: EthersConfig;
  public contractAddresses: ContractAddresses;
  public transactionTimeout: number;
  public contracts: Contracts = {};
  public ethersContracts: Contracts = {};
  public contractAbis: ContractAbis = {};
  public contractConfig: any = {};

  constructor(params: TinlakeParams) {
    const { provider, contractAddresses, transactionTimeout, contractAbis, ethOptions, ethConfig, ethersConfig, contractConfig } = params;
    if (!contractAbis) {
      this.contractAbis = abiDefinitions;
    }

    this.contractConfig = contractConfig || {};
    this.contractAddresses = contractAddresses || {};
    this.transactionTimeout = transactionTimeout;
    this.setProvider(provider, ethOptions);
    this.setEthConfig(ethConfig || {});
    this.setEthersConfig(ethersConfig);
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
        this.contracts[name] = this.eth.contract(this.contractAbis[name]).at(this.contractAddresses[name]);
        this.ethersContracts[name] = this.createContract(this.contractAddresses[name]!, name);
      }
    });

    // modular contracts
    if (this.contractAddresses['JUNIOR_OPERATOR']) {
      this.contracts['JUNIOR_OPERATOR'] = this.contractConfig['JUNIOR_OPERATOR']
                  ? this.createEthContract(this.contractAddresses['JUNIOR_OPERATOR'], this.contractConfig['JUNIOR_OPERATOR'])
                  : this.createEthContract(this.contractAddresses['JUNIOR_OPERATOR'], 'ALLOWANCE_OPERATOR');

      this.ethersContracts['JUNIOR_OPERATOR'] = this.contractConfig['JUNIOR_OPERATOR']
        ? this.createContract(this.contractAddresses['JUNIOR_OPERATOR'], this.contractConfig['JUNIOR_OPERATOR'])
        : this.createContract(this.contractAddresses['JUNIOR_OPERATOR'], 'ALLOWANCE_OPERATOR');
    }
    if (this.contractAddresses['SENIOR_OPERATOR']) {
      this.contracts['SENIOR_OPERATOR'] = this.contractConfig['SENIOR_OPERATOR']
                  ? this.createEthContract(this.contractAddresses['SENIOR_OPERATOR'], this.contractConfig['SENIOR_OPERATOR'])
                  : this.createEthContract(this.contractAddresses['SENIOR_OPERATOR'], 'ALLOWANCE_OPERATOR');

      this.ethersContracts['SENIOR_OPERATOR'] = this.contractConfig['SENIOR_OPERATOR']
        ? this.createContract(this.contractAddresses['SENIOR_OPERATOR'], this.contractConfig['SENIOR_OPERATOR'])
        : this.createContract(this.contractAddresses['SENIOR_OPERATOR'], 'ALLOWANCE_OPERATOR');
    }
  }

  setEthConfig = (ethConfig: EthConfig) => {
    this.ethConfig = {
      ...this.ethConfig,
      ...ethConfig,
    };
  }

  setEthersConfig = (ethersConfig: EthersConfig | undefined) => {
    this.ethersConfig = {
      ...this.ethersConfig,
      ...ethersConfig,
    };
  }

  createEthContract(address: string, abiName: string) {
    const contract = this.eth.contract(this.contractAbis[abiName]).at(address);
    return contract;
  }

  createContract(address: string, abiName: string) {
    return new ethers.Contract(
      address,
      this.contractAbis[abiName],
      this.ethersConfig.provider,
    );
  }

  getContract(address: string, abiName: string): ethers.Contract {
    return new ethers.Contract(
      address,
      this.contractAbis[abiName],
      this.ethersConfig.signer,
    );
  }

  async getTransactionReceipt(tx: PendingTransaction): Promise<ethers.providers.TransactionReceipt> {
    return await this.ethersConfig.provider!.waitForTransaction(tx.hash);
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
