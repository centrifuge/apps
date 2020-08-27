import { Constructor, TinlakeParams } from '../Tinlake';
import BN from 'bn.js';
export declare function EpochActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase): {
    new (...args: any[]): {
        solveEpoch: () => Promise<{
            tinRedeem: number;
            dropRedeem: number;
            tinInvest: number;
            dropInvest: number;
        }>;
        provider: any;
        eth: import("../services/ethereum").ethI;
        ethOptions: any;
        ethConfig: import("../Tinlake").EthConfig;
        ethersConfig: import("../Tinlake").EthersConfig;
        contractAddresses: import("../Tinlake").ContractAddresses;
        transactionTimeout: number;
        contracts: import("../Tinlake").Contracts;
        contractAbis: import("../Tinlake").ContractAbis;
        contractConfig: any;
        setProvider: (provider: any, ethOptions?: any) => void;
        setContracts: () => void;
        setEthConfig: (ethConfig: import("../Tinlake").EthConfig) => void;
        setEthersConfig: (ethersConfig: import("../Tinlake").EthersConfig) => void;
        createContract(address: string, abiName: string): void;
        getOperatorType: (tranche: string) => any;
    };
} & ActionsBase;
export declare type IEpochActions = {
    solveEpoch(): Promise<SolverSolution>;
};
export default EpochActions;
interface BaseState {
    netAssetValue: BN;
    reserve: BN;
    seniorDebt: BN;
    seniorBalance: BN;
}
export interface State extends BaseState {
    netAssetValue: BN;
    reserve: BN;
    seniorDebt: BN;
    seniorBalance: BN;
    minTinRatio: BN;
    maxTinRatio: BN;
    maxReserve: BN;
}
export interface OrderState {
    tinRedeemOrder: number;
    dropRedeemOrder: number;
    tinInvestOrder: number;
    dropInvestOrder: number;
}
export interface SolverSolution {
    tinRedeem: number;
    dropRedeem: number;
    tinInvest: number;
    dropInvest: number;
}
