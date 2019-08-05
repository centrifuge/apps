import BN from 'bn.js';
export declare type LoanStatus = 'Whitelisted' | 'Ongoing' | 'Repaid';
export declare function getLoanStatus(principal: BN, debt: BN): LoanStatus;
