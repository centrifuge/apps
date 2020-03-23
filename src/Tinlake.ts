import Eth from 'ethjs';
import { contractNames, Contracts, ethI, ContractAddresses, ContractAbis, AbiOutput, Options } from './types';
import  abiDefinitions  from './abi/index';
import actions, { TinlakeActions } from './actions/index';
import BN from 'bn.js';

export class Tinlake {
  public provider: any;
  public eth: ethI;
  public ethOptions: any;
  public ethConfig: any;
  public contractAddresses: ContractAddresses;
  public transactionTimeout: number;
  public contracts: Contracts = {};
  public contractAbis: ContractAbis = {};

  constructor(provider: any, contractAddresses: ContractAddresses, nftDataOutputs: AbiOutput[], transactionTimeout: number,
              { contractAbis, ethOptions, ethConfig }: Options = {}) {

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
  setEthConfig = (ethConfig: { [key: string]: any }) => {
    this.ethConfig = ethConfig;
  }
}

const { Admin, Borrower, Lender, Analytics, Currency, Collateral, Governance, Proxy } = actions;
const TinlakeWithActions = (Proxy(Borrower(Admin(Lender(Analytics(Currency(Collateral(Governance(Tinlake)))))))));

export type ITinlake = TinlakeActions & {
  setProvider(provider: any, ethOptions?: any) : void,
  setEthConfig(ethConfig: { [key: string]: any }): void,
};

export default TinlakeWithActions;

export * from './utils/baseToDisplay';
export * from './utils/bnToHex';
export * from './utils/displayToBase';
export * from './utils/feeToInterestRate';
export * from './utils/getLoanStatus';
export * from './utils/interestRateToFee';
