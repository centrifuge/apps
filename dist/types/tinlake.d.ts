import { TinlakeActions } from '../actions';
import BN from 'bn.js';
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
};
export declare type NFT = {
    tokenId: BN;
    nftOwner: string;
    nftData: any;
};
export declare type Investor = {
    maxSupplyJunior: BN;
    maxSupplySenior?: BN;
    maxRedeemJunior: BN;
    maxRedeemSenior?: BN;
    tokenBalanceJunior: BN;
    tokenBalanceSenior?: BN;
    address: string;
};
export declare type ITinlake = TinlakeActions & {
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
};
