export declare const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export interface ethI {
    send: Function;
    web3_sha3: (signature: string) => string;
    getTransactionReceipt: (arg0: any, arg1: (err: any, receipt: any) => void) => void;
    getTransactionByHash: (arg0: any, arg1: (err: any, tx: any) => void) => void;
    contract: (arg0: any) => {
        at: (arg0: any) => void;
    };
    sendRawTransaction: any;
    getTransactionCount: any;
    abi: any;
}
export interface Events {
    txHash: string;
    status: any;
    events: {
        event: {
            name: any;
        };
        data: any[];
    }[];
}
export declare function executeAndRetry(f: Function, args?: any): Promise<any>;
export declare const waitAndReturnEvents: (eth: ethI, txHash: string, abi: any, transactionTimeout: number) => Promise<unknown>;
export declare const waitForTransaction: (eth: ethI, txHash: any, transactionTimeout: number) => Promise<unknown>;
export declare const findEvent: (abi: {
    filter: (arg0: (item: any) => boolean | undefined) => any[];
}, funcSignature: any) => any[];
