import { Account } from './types';
import { EthConfig } from '../Tinlake';
import { ITinlake } from '../types/tinlake';
import { ProviderConfig } from './config';
import { ethers } from 'ethers';
export declare class TestProvider {
    wallet: ethers.Wallet;
    ethConfig: EthConfig;
    transactionTimeout: number;
    constructor(testConfig: ProviderConfig);
    fundAccountWithETH(usr: string, amount: string): Promise<void>;
}
export declare function createTinlake(usr: Account, testConfig: ProviderConfig): ITinlake;
