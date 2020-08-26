import { ethI } from './services/ethereum';
import { ethers } from 'ethers';
declare const contractNames: readonly ["TINLAKE_CURRENCY", "JUNIOR_OPERATOR", "JUNIOR", "JUNIOR_TOKEN", "SENIOR", "SENIOR_TOKEN", "SENIOR_OPERATOR", "DISTRIBUTOR", "ASSESSOR", "TITLE", "PILE", "SHELF", "CEILING", "COLLECTOR", "THRESHOLD", "PRICE_POOL", "COLLATERAL_NFT", "COLLATERAL_NFT_DATA", "ROOT_CONTRACT", "PROXY", "PROXY_REGISTRY", "ACTIONS", "BORROWER_DEPLOYER", "LENDER_DEPLOYER", "NFT_FEED", "GOVERNANCE", "ALLOWANCE_OPERATOR"];
export declare type PendingTransaction = {
    hash: string | undefined;
    timesOutAt?: number;
};
export declare type EthConfig = {
    from?: string;
    gasPrice?: string;
    gas?: string;
};
export declare type EthersOverrides = {
    gasPrice?: number;
    gasLimit?: number;
};
export declare type EthersConfig = {
    provider: ethers.providers.Provider;
    signer: ethers.Signer;
    overrides?: EthersOverrides;
};
export declare type ContractName = typeof contractNames[number];
export declare type Contracts = {
    [key in ContractName]?: any;
};
export declare type ContractAbis = {
    [key in ContractName]?: any;
};
export declare type ContractAddresses = {
    [key in ContractName]?: string;
};
export declare type TinlakeParams = {
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
export declare type Constructor<T = {}> = new (...args: any[]) => Tinlake;
export default class Tinlake {
    provider: any;
    eth: ethI;
    ethOptions: any;
    ethConfig: EthConfig;
    ethersConfig: EthersConfig;
    contractAddresses: ContractAddresses;
    transactionTimeout: number;
    contracts: Contracts;
    ethersContracts: Contracts;
    contractAbis: ContractAbis;
    contractConfig: any;
    constructor(params: TinlakeParams);
    setProvider: (provider: any, ethOptions?: any) => void;
    setContracts: () => void;
    setEthConfig: (ethConfig: EthConfig) => void;
    setEthersConfig: (ethersConfig: EthersConfig | undefined) => void;
    createEthContract(address: string, abiName: ContractName): void;
    createContract(address: string, abiName: ContractName): ethers.Contract;
    getContract(address: string, abiName: ContractName): ethers.Contract;
    contract(abiName: ContractName, address?: string): ethers.Contract;
    pending(txPromise: Promise<ethers.providers.TransactionResponse>): Promise<PendingTransaction>;
    getTransactionReceipt(tx: PendingTransaction): Promise<ethers.providers.TransactionReceipt>;
    getOperatorType: (tranche: string) => any;
}
export {};
