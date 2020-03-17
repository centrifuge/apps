import { Constructor, Tinlake } from '../types';
declare function BorrowerActions<ActionsBase extends Constructor<Tinlake>>(Base: ActionsBase): {
    new (...args: any[]): {
        issue: (registry: string, tokenId: string) => Promise<unknown>;
        lock: (loan: string) => Promise<unknown>;
        unlock: (loan: string) => Promise<unknown>;
        close: (loan: string) => Promise<unknown>;
        borrow: (loan: string, currencyAmount: string) => Promise<unknown>;
        withdraw: (loan: string, currencyAmount: string, usr: string) => Promise<unknown>;
        repay: (loan: string, currencyAmount: string) => Promise<unknown>;
        provider: any;
        eth: import("../types").ethI;
        ethOptions: any;
        ethConfig: any;
        contractAddresses: import("../types").ContractAddresses;
        transactionTimeout: number;
        contracts: import("../types").Contracts;
        contractAbis: import("../types").ContractAbis;
    };
} & ActionsBase;
export declare type IBorrowerActions = {
    issue(registry: string, tokenId: string): Promise<any>;
    lock(loan: string): Promise<any>;
    unlock(loan: string): Promise<any>;
    close(loan: string): Promise<any>;
    borrow(loan: string, currencyAmount: string): Promise<any>;
    withdraw(loan: string, currencyAmount: string, usr: string): Promise<any>;
    repay(loan: string, currencyAmount: string): Promise<any>;
};
export default BorrowerActions;
