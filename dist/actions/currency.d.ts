import { Constructor, TinlakeParams, PendingTransaction } from '../Tinlake';
import BN from 'bn.js';
export declare function CurrencyActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase): {
    new (...args: any[]): {
        mintCurrency: (usr: string, amount: string) => Promise<unknown>;
        getCurrencyAllowance: (owner: string, spender: string) => Promise<any>;
        getJuniorForCurrencyAllowance: (owner: string) => Promise<any>;
        getSeniorForCurrencyAllowance: (owner: string) => Promise<any>;
        getCurrencyBalance: (user: string) => Promise<BN>;
        approveCurrency: (usr: string, currencyAmount: string) => Promise<{
            hash: any;
            contractKey: string;
        }>;
        approveSeniorForCurrency: (currencyAmount: string) => Promise<{
            hash: any;
            contractKey: string;
        } | undefined>;
        approveJuniorForCurrency: (currencyAmount: string) => Promise<{
            hash: any;
            contractKey: string;
        } | undefined>;
        provider: any;
        eth: import("../services/ethereum").ethI;
        ethOptions: any;
        ethConfig: import("../Tinlake").EthConfig;
        ethersConfig: import("../Tinlake").EthersConfig;
        contractAddresses: import("../Tinlake").ContractAddresses;
        transactionTimeout: number;
        contracts: import("../Tinlake").Contracts;
        ethersContracts: import("../Tinlake").Contracts;
        contractAbis: import("../Tinlake").ContractAbis;
        contractConfig: any;
        setProvider: (provider: any, ethOptions?: any) => void;
        setContracts: () => void;
        setEthConfig: (ethConfig: import("../Tinlake").EthConfig) => void;
        setEthersConfig: (ethersConfig: import("../Tinlake").EthersConfig | undefined) => void;
        createEthContract(address: string, abiName: string): void;
        createContract(address: string, abiName: string): import("ethers").Contract;
        getContract(address: string, abiName: string): import("ethers").Contract;
        getTransactionReceipt(tx: PendingTransaction): Promise<import("ethers/providers").TransactionReceipt>;
        getOperatorType: (tranche: string) => any;
    };
} & ActionsBase;
export declare type ICurrencyActions = {
    mintCurrency(usr: string, amount: string): Promise<unknown>;
    getCurrencyBalance(usr: string): Promise<BN>;
    getCurrencyAllowance: (owner: string, spender: string) => Promise<BN>;
    getJuniorForCurrencyAllowance: (owner: string) => Promise<BN | undefined>;
    getSeniorForCurrencyAllowance: (owner: string) => Promise<BN | undefined>;
    approveCurrency(usr: string, amount: string): Promise<PendingTransaction>;
    approveSeniorForCurrency: (currencyAmount: string) => Promise<PendingTransaction | undefined>;
    approveJuniorForCurrency: (currencyAmount: string) => Promise<PendingTransaction | undefined>;
};
export default CurrencyActions;
