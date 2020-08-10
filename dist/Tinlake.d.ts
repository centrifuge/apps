import { ethI } from './services/ethereum';
declare const contractNames: string[];
export declare type EthConfig = {
    from?: string;
    gasPrice?: string;
    gas?: string;
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
    contractAddresses: ContractAddresses;
    transactionTimeout: number;
    contracts: Contracts;
    contractAbis: ContractAbis;
    contractConfig: any;
    constructor(params: TinlakeParams);
    setProvider: (provider: any, ethOptions?: any) => void;
    setContracts: () => void;
    setEthConfig: (ethConfig: EthConfig) => void;
    createContract(address: string, abiName: string): void;
    getOperatorType: (tranche: string) => any;
}
export {};
