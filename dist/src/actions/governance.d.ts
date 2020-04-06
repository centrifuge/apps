import { Constructor, Tinlake } from '../types';
export declare function GovernanceActions<ActionsBase extends Constructor<Tinlake>>(Base: ActionsBase): {
    new (...args: any[]): {
        relyAddress: (usr: string, contractAddress: string) => Promise<unknown>;
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
export declare type IGovernanceActions = {
    relyAddress(usr: string, contractAddress: string): Promise<any>;
};
export default GovernanceActions;
