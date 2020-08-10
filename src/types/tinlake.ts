 import { TinlakeActions } from '../actions';
import BN from 'bn.js';
import Tinlake, { EthConfig, ContractAddresses, ContractAbis, Contracts } from '../Tinlake';

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

export type ITinlake = TinlakeActions & Tinlake;
