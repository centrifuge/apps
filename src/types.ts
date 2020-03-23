import BN from 'bn.js';
export type Constructor<T = {}> = new (...args: any[]) => T;

export interface Tinlake {
  provider: any;
  eth: ethI;
  ethOptions: any;
  ethConfig: any;
  contractAddresses: ContractAddresses;
  transactionTimeout: number;
  contracts: Contracts;
  contractAbis: ContractAbis;
}

export interface ethI {
  send: Function;
  web3_sha3: (signature: string) => string;
  getTransactionReceipt: (arg0: any, arg1: (err: any, receipt: any) => void) => void;
  getTransactionByHash: (arg0: any, arg1: (err: any, tx: any) => void) => void;
  contract: (arg0: any) => { at: (arg0: any) => void };
  sendRawTransaction: any;
  getTransactionCount: any;
  abi: any;
}

export interface Options {
  contractAbis?: ContractAbis;
  ethOptions?: any;
  ethConfig?: any;
}

export interface EthConfig {
  from: string;
  gasLimit: string;
}

export const contractNames = [
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

export interface AbiOutput {
  name: string;
  type: 'address' | 'uint256';
}

export interface Events {
  txHash: string;
  status: any;
  events: { event: { name: any }, data: any[] }[];
}

export interface Balance {
  [x: string]: { toString: () => string; };
}

export type Address = string;

export interface Loan {
  loanId: string;
  registry: Address;
  tokenId: number;
  ownerOf: string;
  principal: BN;
  interestRate: BN;
  debt: BN;
  threshold?: BN;
  price?: BN;
  status?: string;
}

export interface Investor {
  address:string;
  maxSupplyJunior: BN;
  maxSupplySenior?: BN;
  maxRedeemJunior: BN;
  maxRedeemSenior?: BN;
  tokenBalanceJunior: BN;
  tokenBalanceSenior?: BN;
}

export interface BalanceDebt {
  debt: BN;
  balance: BN;
  fee: BN;
  chi: BN;
}
