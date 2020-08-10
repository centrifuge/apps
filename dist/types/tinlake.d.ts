import { TinlakeActions } from '../actions';
import BN from 'bn.js';
import Tinlake from '../Tinlake';
export declare type Loan = {
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
export declare type Tranche = {
    availableFunds: BN;
    tokenPrice: BN;
    type: string;
    token: string;
    totalSupply: BN;
    interestRate?: BN;
};
export declare type NFT = {
    registry: string;
    tokenId: BN;
    nftOwner: string;
    nftData: any;
};
export declare type Investor = {
    junior: {
        maxSupply: BN;
        tokenBalance: BN;
        maxRedeem: BN;
    };
    senior: {
        maxSupply?: BN;
        tokenBalance?: BN;
        maxRedeem?: BN;
    };
    address: string;
};
export declare type ITinlake = TinlakeActions & Tinlake;
