import { Account } from './types';
import { EthConfig } from '../Tinlake';
import { ITinlake } from '../types/tinlake';
import { ethI } from '../services/ethereum';
export declare class TestProvider {
    eth: ethI;
    sponsorAccount: Account;
    ethConfig: EthConfig;
    transactionTimeout: number;
    gasLimit: number;
    constructor(testConfig: any);
    fundAccountWithETH(usr: string, amount: string): Promise<void>;
}
export declare function createTinlake(usr: Account, testConfig: any): Partial<ITinlake>;
