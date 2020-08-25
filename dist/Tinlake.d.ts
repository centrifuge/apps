import { ethI } from './services/ethereum';
import { ethers } from 'ethers';
declare const contractNames: string[];
export declare type PendingTransaction = {
    hash: string;
    contractKey: string;
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
export declare type ContractNames = typeof contractNames[number];
export declare type Contracts = {
    [key in ContractNames]?: any;
};
export declare type ContractAbis = {
    [key in ContractNames]?: any;
};
export declare type ContractAddresses = {
    [key in ContractNames]?: string;
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
    createEthContract(address: string, abiName: string): void;
    createContract(address: string, abiName: string): ethers.Contract;
    getContract(address: string, abiName: string): ethers.Contract;
    getTransactionReceipt(tx: PendingTransaction): Promise<ethers.providers.TransactionReceipt>;
    getOperatorType: (tranche: string) => any;
}
export {};
