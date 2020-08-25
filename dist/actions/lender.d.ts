import { Constructor, TinlakeParams, PendingTransaction } from '../Tinlake';
import BN from 'bn.js';
export declare function LenderActions<ActionBase extends Constructor<TinlakeParams>>(Base: ActionBase): {
    new (...args: any[]): {
        supplySenior: (currencyAmount: string) => Promise<{
            hash: any;
            contractKey: string;
        }>;
        redeemSenior: (tokenAmount: string) => Promise<unknown>;
        getSeniorTokenAllowance: (owner: string) => Promise<BN>;
        approveSeniorToken: (tokenAmount: string) => Promise<unknown>;
        supplyJunior: (currencyAmount: string) => Promise<{
            hash: any;
            contractKey: string;
        }>;
        redeemJunior: (tokenAmount: string) => Promise<unknown>;
        getJuniorTokenAllowance: (owner: string) => Promise<BN>;
        approveJuniorToken: (tokenAmount: string) => Promise<unknown>;
        balance: () => Promise<unknown>;
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
} & ActionBase;
export declare type ILenderActions = {
    getSeniorTokenAllowance(owner: string): Promise<BN>;
    getJuniorTokenAllowance(owner: string): Promise<BN>;
    supplyJunior(currencyAmount: string): Promise<PendingTransaction>;
    approveJuniorToken: (tokenAmount: string) => Promise<unknown>;
    approveSeniorToken: (tokenAmount: string) => Promise<unknown>;
    redeemJunior(tokenAmount: string): Promise<any>;
    supplySenior(currencyAmount: string): Promise<PendingTransaction>;
    redeemSenior(tokenAmount: string): Promise<any>;
    balance(): Promise<any>;
};
export default LenderActions;
