import { Constructor, TinlakeParams } from '../Tinlake';
import BN from 'bn.js';
export declare function CurrencyActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase): {
    new (...args: any[]): {
        mintCurrency: (usr: string, amount: string) => Promise<unknown>;
        getCurrencyAllowance: (owner: string, spender: string) => Promise<BN>;
        getJuniorForCurrencyAllowance: (owner: string) => Promise<BN | undefined>;
        getSeniorForCurrencyAllowance: (owner: string) => Promise<BN | undefined>;
        getCurrencyBalance: (user: string) => Promise<BN>;
        approveCurrency: (usr: string, currencyAmount: string) => Promise<unknown>;
        approveSeniorForCurrency: (currencyAmount: string) => Promise<unknown>;
        approveJuniorForCurrency: (currencyAmount: string) => Promise<unknown>;
        provider: any;
        eth: import("../services/ethereum").ethI;
        ethOptions: any;
        ethConfig: import("../Tinlake").EthConfig;
        contractAddresses: import("../Tinlake").ContractAddresses;
        transactionTimeout: number;
        contracts: import("../Tinlake").Contracts;
        contractAbis: import("../Tinlake").ContractAbis;
        contractConfig: any;
        setProvider: (provider: any, ethOptions?: any) => void;
        setContracts: () => void;
        setEthConfig: (ethConfig: import("../Tinlake").EthConfig) => void;
        createContract(address: string, abiName: string): void;
        getOperatorType: (tranche: string) => any;
    };
} & ActionsBase;
export declare type ICurrencyActions = {
    mintCurrency(usr: string, amount: string): Promise<unknown>;
    getCurrencyBalance(usr: string): Promise<BN>;
    approveCurrency(usr: string, amount: string): Promise<unknown>;
    getCurrencyAllowance: (owner: string, spender: string) => Promise<BN>;
    getJuniorForCurrencyAllowance: (owner: string) => Promise<BN | undefined>;
    getSeniorForCurrencyAllowance: (owner: string) => Promise<BN | undefined>;
    approveSeniorForCurrency: (currencyAmount: string) => Promise<unknown>;
    approveJuniorForCurrency: (currencyAmount: string) => Promise<unknown>;
};
export default CurrencyActions;
