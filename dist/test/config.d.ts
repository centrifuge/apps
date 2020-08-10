import { Account } from './types';
import { ContractAddresses, ContractAbis } from '../Tinlake';
declare const testConfig: ProviderConfig;
export declare type ProviderConfig = {
    rpcUrl: string;
    godAccount: Account;
    gas: string;
    gasPrice: string;
    nftRegistry: string;
    transactionTimeout: number;
    contractAddresses: ContractAddresses;
    contractAbis: ContractAbis;
    SUCCESS_STATUS: '0x1';
    FAIL_STATUS: '0x0';
    FAUCET_AMOUNT: string;
};
export default testConfig;
