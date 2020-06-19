import { Constructor, TinlakeParams } from '../Tinlake';
declare function GovernanceActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase): {
    new (...args: any[]): {
        relyAddress: (usr: string, contractAddress: string) => Promise<unknown>;
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
export declare type IGovernanceActions = {
    relyAddress(usr: string, contractAddress: string): Promise<any>;
};
export default GovernanceActions;
