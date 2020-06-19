import { Constructor, TinlakeParams } from '../Tinlake';
export declare function BorrowerActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase): {
    new (...args: any[]): {
        issue: (registry: string, tokenId: string) => Promise<unknown>;
        nftLookup: (registry: string, tokenId: string) => Promise<any>;
        lock: (loan: string) => Promise<unknown>;
        unlock: (loan: string) => Promise<unknown>;
        close: (loan: string) => Promise<unknown>;
        borrow: (loan: string, currencyAmount: string) => Promise<unknown>;
        withdraw: (loan: string, currencyAmount: string, usr: string) => Promise<unknown>;
        repay: (loan: string, currencyAmount: string) => Promise<unknown>;
        provider: any;
        eth: import("../services/ethereum").ethI;
        ethOptions: any;
        ethConfig: {} | import("../Tinlake").EthConfig;
        contractAddresses: import("../Tinlake").ContractAddresses;
        transactionTimeout: number;
        contracts: import("../Tinlake").Contracts;
        contractAbis: import("../Tinlake").ContractAbis;
        contractConfig: any;
        setProvider: (provider: any, ethOptions?: any) => void;
        setContracts: () => void;
        setEthConfig: (ethConfig: {} | import("../Tinlake").EthConfig) => void;
        createContract(address: string, abiName: string): void;
        getOperatorType: (tranche: string) => any;
    };
} & ActionsBase;
export declare type IBorrowerActions = {
    issue(registry: string, tokenId: string): Promise<any>;
    nftLookup(registry: string, tokenId: string): Promise<any>;
    lock(loan: string): Promise<any>;
    unlock(loan: string): Promise<any>;
    close(loan: string): Promise<any>;
    borrow(loan: string, currencyAmount: string): Promise<any>;
    withdraw(loan: string, currencyAmount: string, usr: string): Promise<any>;
    repay(loan: string, currencyAmount: string): Promise<any>;
};
export default BorrowerActions;
