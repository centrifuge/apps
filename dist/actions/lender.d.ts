import { Constructor, TinlakeParams } from '../Tinlake';
export declare function LenderActions<ActionBase extends Constructor<TinlakeParams>>(Base: ActionBase): {
    new (...args: any[]): {
        supplySenior: (currencyAmount: string) => Promise<unknown>;
        redeemSenior: (tokenAmount: string) => Promise<unknown>;
        approveSeniorToken: (usr: string, tokenAmount: string) => Promise<unknown>;
        supplyJunior: (currencyAmount: string) => Promise<unknown>;
        redeemJunior: (tokenAmount: string) => Promise<unknown>;
        approveJuniorToken: (usr: string, tokenAmount: string) => Promise<unknown>;
        balance: () => Promise<unknown>;
        provider: any;
        eth: import("../services/ethereum").ethI;
        ethOptions: any;
        ethConfig: {} | import("../Tinlake").EthConfig;
        contractAddresses: import("../Tinlake").ContractAddresses;
        transactionTimeout: number;
        contracts: import("../Tinlake").Contracts;
        contractAbis: import("../Tinlake").ContractAbis;
        setProvider: (provider: any, ethOptions?: any) => void;
        setEthConfig: (ethConfig: {} | import("../Tinlake").EthConfig) => void;
    };
} & ActionBase;
export declare type ILenderActions = {
    supplyJunior(currencyAmount: string): Promise<any>;
    redeemJunior(tokenAmount: string): Promise<any>;
    supplySenior(currencyAmount: string): Promise<any>;
    redeemSenior(tokenAmount: string): Promise<any>;
    balance(): Promise<any>;
};
export default LenderActions;
