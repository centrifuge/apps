import { Constructor, Tinlake } from '../types';
import BN from 'bn.js';
declare function ProxyActions<ActionsBase extends Constructor<Tinlake>>(Base: ActionsBase): {
    new (...args: any[]): {
        getProxyAccessTokenOwner: (tokenId: string) => Promise<BN>;
        buildProxy: (owner: string) => Promise<any>;
        getProxy: (accessTokenId: string) => Promise<any>;
        getProxyAccessToken: (proxyAddr: string) => Promise<any>;
        getProxyOwnerByLoan: (loanId: string) => Promise<BN>;
        proxyCount: () => Promise<BN>;
        checkProxyExists: (address: string) => Promise<string | null>;
        proxyCreateNew: (address: string) => Promise<any>;
        proxyTransferIssue: (proxyAddr: string, tokenId: string) => Promise<unknown>;
        proxyLockBorrowWithdraw: (proxyAddr: string, loanId: string, amount: string, usr: string) => Promise<unknown>;
        proxyRepayUnlockClose: (proxyAddr: string, tokenId: string, loanId: string) => Promise<unknown>;
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
export declare type IProxyActions = {
    buildProxy(owner: string): Promise<any>;
    checkProxyExists(provider: any, address: string): Promise<string | null>;
    getProxy(accessTokenId: string): Promise<any>;
    proxyCount(): Promise<any>;
    getProxyAccessToken(proxyAddr: string): Promise<any>;
    getProxyAccessTokenOwner(tokenId: string): Promise<any>;
    getProxyOwnerByLoan(loanId: string): Promise<any>;
    proxyCreateNew(address: string): Promise<any>;
    proxyTransferIssue(proxyAddr: string, tokenId: string): Promise<any>;
    proxyLockBorrowWithdraw(proxyAddr: string, loanId: string, amount: string, usr: string): Promise<any>;
    proxyRepayUnlockClose(proxyAddr: string, tokenId: string, loanId: string): Promise<any>;
};
export default ProxyActions;
