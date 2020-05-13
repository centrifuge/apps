 import { TinlakeActions } from '../actions';
import BN from 'bn.js';

export type Loan = {
  loanId: string;
  registry: string;
  tokenId: BN;
  ownerOf: BN;
  principal: BN;
  interestRate: BN;
  debt: BN;
  threshold?: BN;
  price?: BN;
  status?: string;
  nft?: NFT;
  proxyOwner?: string;
};

export type Tranche = {
  availableFunds: BN;
  tokenPrice: BN;
  type: string;
  token: string;
  totalSupply: BN;
  interestRate?: BN;
};
export type NFT = {
  registry: string;
  tokenId: BN;
  nftOwner: string;
  nftData: any;
};
export type Investor = {
  junior: {
    maxSupply: BN;
    tokenBalance: BN;
    maxRedeem: BN;
  },
  senior: {
    maxSupply?: BN;
    tokenBalance?: BN;
    maxRedeem?: BN;
  },
  address: string;
};

export type ITinlake = TinlakeActions & {
  provider: any;
  eth: any;
  ethOptions: any;
  ethConfig: any;
  contractAddresses: any;
  transactionTimeout: number;
  contracts: any;
  contractAbis: any;
  setProvider(provider: any, ethOptions?: any): void;
  setEthConfig(ethConfig: {
    [key: string]: any;
  }): void;
  setContractAddresses(): () => Promise<void>;
};
