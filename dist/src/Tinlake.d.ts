import { Contracts, ethI, ContractAddresses, ContractAbis, AbiOutput, Options } from './types';
import { TinlakeActions } from './actions/index';
import BN from 'bn.js';
export declare class Tinlake {
    provider: any;
    eth: ethI;
    ethOptions: any;
    ethConfig: any;
    contractAddresses: ContractAddresses;
    transactionTimeout: number;
    contracts: Contracts;
    contractAbis: ContractAbis;
    constructor(provider: any, contractAddresses: ContractAddresses, nftDataOutputs: AbiOutput[], transactionTimeout: number, { contractAbis, ethOptions, ethConfig }?: Options);
    setProvider: (provider: any, ethOptions?: any) => void;
    setEthConfig: (ethConfig: {
        [key: string]: any;
    }) => void;
}
declare const TinlakeWithActions: {
    new (...args: any[]): {
        issue: (registry: string, tokenId: string) => Promise<unknown>;
        lock: (loan: string) => Promise<unknown>;
        unlock: (loan: string) => Promise<unknown>;
        close: (loan: string) => Promise<unknown>;
        borrow: (loan: string, currencyAmount: string) => Promise<unknown>;
        withdraw: (loan: string, currencyAmount: string, usr: string) => Promise<unknown>;
        repay: (loan: string, currencyAmount: string) => Promise<unknown>;
        provider: any;
        eth: ethI;
        ethOptions: any;
        ethConfig: any;
        contractAddresses: ContractAddresses;
        transactionTimeout: number;
        contracts: Contracts;
        contractAbis: ContractAbis;
    };
} & {
    new (...args: any[]): {
        isWard: (user: string, contractName: string) => Promise<BN>;
        canSetCeiling: (user: string) => Promise<boolean>;
        canSetInterestRate: (user: string) => Promise<boolean>;
        canSetJuniorTrancheInterest: (user: string) => Promise<boolean>;
        canSetSeniorTrancheInterest: (user: string) => Promise<boolean>;
        canSetEquityRatio: (user: string) => Promise<boolean>;
        canSetRiskScore: (user: string) => Promise<boolean>;
        canSetInvestorAllowanceJunior: (user: string) => Promise<boolean>;
        canSetThreshold: (user: string) => Promise<boolean>;
        canSetLoanPrice: (user: string) => Promise<boolean>;
        setCeiling: (loanId: string, amount: string) => Promise<unknown>;
        existsRateGroup: (ratePerSecond: string) => Promise<boolean>;
        initRate: (ratePerSecond: string) => Promise<unknown>;
        changeRate: (loan: string, ratePerSecond: string) => Promise<unknown>;
        setRate: (loan: string, ratePerSecond: string) => Promise<unknown>;
        approveAllowanceJunior: (user: string, maxCurrency: string, maxToken: string) => Promise<unknown>;
        provider: any;
        eth: ethI;
        ethOptions: any;
        ethConfig: any;
        contractAddresses: ContractAddresses;
        transactionTimeout: number;
        contracts: Contracts;
        contractAbis: ContractAbis;
    };
} & {
    new (...args: any[]): {
        contracts: Contracts;
        ethConfig: import("./types").EthConfig;
        getInvestor: (user: string) => Promise<import("./types").Investor>;
        existsSenior: () => boolean;
        supplyJunior: (currencyAmount: string) => Promise<unknown>;
        redeemJunior: (tokenAmount: string) => Promise<unknown>;
        getJuniorTokenBalance: (user: string) => Promise<BN>;
        getSeniorTokenBalance: (user: string) => Promise<BN>;
        approveJuniorToken: (usr: string, tokenAmount: string) => Promise<unknown>;
        approveSeniorToken: (usr: string, tokenAmount: string) => Promise<unknown>;
        getMaxSupplyAmountJunior: (user: string) => Promise<BN>;
        getMaxSupplyAmountSenior: (user: string) => Promise<BN>;
        getMaxRedeemAmountJunior: (user: string) => Promise<any>;
        getMaxRedeemAmountSenior: (user: string) => Promise<any>;
        getTokenPriceJunior: () => Promise<any>;
        balance: () => Promise<unknown>;
        provider: any;
        eth: ethI;
        ethOptions: any;
        contractAddresses: ContractAddresses;
        transactionTimeout: number;
        contractAbis: ContractAbis;
    };
} & {
    new (...args: any[]): {
        getTotalDebt: () => Promise<BN>;
        getTotalBalance: () => Promise<BN>;
        getPrincipal: (loanId: string) => Promise<BN>;
        getDebt: (loanID: string) => Promise<BN>;
        loanCount: () => Promise<BN>;
        getCollateral: (loanId: string) => Promise<any>;
        getOwnerOfCollateral: (tokenId: string) => Promise<BN>;
        getInterestRate: (loanId: string) => Promise<BN>;
        getOwnerOfLoan: (loanId: string) => Promise<any>;
        getStatus: (tokenId: string, loanId: string) => Promise<any>;
        getLoan: (loanId: string) => Promise<import("./types").Loan | null>;
        getLoanList: () => Promise<import("./types").Loan[]>;
        provider: any;
        eth: ethI;
        ethOptions: any;
        ethConfig: any;
        contractAddresses: ContractAddresses;
        transactionTimeout: number;
        contracts: Contracts;
        contractAbis: ContractAbis;
    };
} & {
    new (...args: any[]): {
        mintCurrency: (usr: string, amount: string) => Promise<void>;
        getCurrencyBalance: (user: string) => Promise<BN>;
        getJuniorBalance: () => Promise<BN>;
        getSeniorBalance: () => Promise<BN>;
        getTrancheBalance: () => Promise<BN>;
        approveCurrency: (usr: string, currencyAmount: string) => Promise<unknown>;
        provider: any;
        eth: ethI;
        ethOptions: any;
        ethConfig: any;
        contractAddresses: ContractAddresses;
        transactionTimeout: number;
        contracts: Contracts;
        contractAbis: ContractAbis;
    };
} & {
    new (...args: any[]): {
        mintTitleNFT: (user: string) => Promise<unknown>;
        mintNFT: (owner: string, tokenId: string, ref: string, amount: string, asset: string) => Promise<unknown>;
        approveNFT: (tokenId: string, to: string) => Promise<unknown>;
        getNFTCount: () => Promise<BN>;
        getNFTData: (tokenId: string) => Promise<any>;
        provider: any;
        eth: ethI;
        ethOptions: any;
        ethConfig: any;
        contractAddresses: ContractAddresses;
        transactionTimeout: number;
        contracts: Contracts;
        contractAbis: ContractAbis;
    };
} & {
    new (...args: any[]): {
        relyAddress: (usr: string, contractAddress: string) => Promise<unknown>;
        provider: any;
        eth: ethI;
        ethOptions: any;
        ethConfig: any;
        contractAddresses: ContractAddresses;
        transactionTimeout: number;
        contracts: Contracts;
        contractAbis: ContractAbis;
    };
} & typeof Tinlake;
export declare type ITinlake = TinlakeActions & {
    setProvider(provider: any, ethOptions?: any): void;
    setEthConfig(ethConfig: {
        [key: string]: any;
    }): void;
};
export default TinlakeWithActions;
export * from './utils/baseToDisplay';
export * from './utils/bnToHex';
export * from './utils/displayToBase';
export * from './utils/feeToInterestRate';
export * from './utils/getLoanStatus';
export * from './utils/interestRateToFee';
