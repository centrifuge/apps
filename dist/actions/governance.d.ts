import { Constructor, TinlakeParams } from '../Tinlake';
declare function GovernanceActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase): {
    new (...args: any[]): {
        relyAddress: (usr: string, contractAddress: string) => Promise<unknown>;
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
        getTransactionReceipt(tx: import("../Tinlake").PendingTransaction): Promise<import("ethers/providers").TransactionReceipt>;
        getOperatorType: (tranche: string) => any;
    };
} & ActionsBase;
export declare type IGovernanceActions = {
    relyAddress(usr: string, contractAddress: string): Promise<any>;
};
export default GovernanceActions;
