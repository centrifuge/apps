import { Constructor, Tinlake } from '../types';
import BN from 'bn.js';
export declare function CurrencyActions<ActionsBase extends Constructor<Tinlake>>(Base: ActionsBase): {
    new (...args: any[]): {
        mintCurrency: (usr: string, amount: string) => Promise<void>;
        getCurrencyBalance: (user: string) => Promise<BN>;
        getJuniorBalance: () => Promise<BN>;
        getSeniorBalance: () => Promise<BN>;
        getTrancheBalance: () => Promise<BN>;
        approveCurrency: (usr: string, currencyAmount: string) => Promise<unknown>;
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
export declare type ICurrencyActions = {
    mintCurrency(usr: string, amount: string): void;
    getCurrencyBalance(usr: string): Promise<BN>;
    approveCurrency(usr: string, amount: string): Promise<any>;
    getJuniorBalance(): Promise<BN>;
    getSeniorBalance(): Promise<BN>;
    getTrancheBalance(): Promise<BN>;
};
export default CurrencyActions;
