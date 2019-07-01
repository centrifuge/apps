import BN from 'bn.js';
interface ContractAbis {
    'nft': any;
    'title': any;
    'currency': any;
    'admit': any;
    'reception': any;
    'desk': any;
    'shelf': any;
    'appraiser': any;
    'lender': any;
    'pile': any;
}
interface ContractAddresses {
    'APPRAISER': string;
    'TITLE': string;
    'LIGHTSWITCH': string;
    'PILE': string;
    'SHELF': string;
    'COLLATERAL': string;
    'DESK': string;
    'RECEPTION': string;
    'LENDER': string;
    'CVTJOIN': string;
    'CVTPIP': string;
    'NFT_COLLATERAL': string;
    'DEPLOYER': string;
    'ADMIT': string;
    'SPELL': string;
    'CURRENCY': string;
}
interface Options {
    contractAbis?: ContractAbis;
    contractAddresses?: ContractAddresses;
    ethOptions?: any;
    ethConfig?: any;
}
interface Contracts {
    nft: any;
    title: any;
    currency: any;
    admit: any;
    reception: any;
    desk: any;
    shelf: any;
    appraiser: any;
    lender: any;
    pile: any;
}
interface ethI {
    getTransactionReceipt: (arg0: any, arg1: (err: any, receipt: any) => void) => void;
    getTransactionByHash: (arg0: any, arg1: (err: any, tx: any) => void) => void;
    contract: (arg0: any) => {
        at: (arg0: any) => void;
    };
}
interface Events {
    txHash: string;
    status: any;
    events: {
        event: {
            name: any;
        };
        data: any[];
    }[];
}
interface Balance {
    [x: string]: {
        toString: () => string;
    };
}
export declare type Address = string;
export interface Loan {
    registry: Address;
    tokenId: BN;
    price: BN;
    principal: BN;
}
export interface BalanceDebt {
    debt: BN;
    balance: BN;
    fee: BN;
    chi: BN;
}
declare class Tinlake {
    provider: any;
    eth: ethI;
    ethOptions: any;
    ethConfig: any;
    contractAddresses: ContractAddresses;
    contracts: Contracts;
    contractAbis: ContractAbis;
    constructor(provider: any, { contractAbis, contractAddresses, ethOptions, ethConfig }?: Options);
    loanCount: () => Promise<BN>;
    getLoan: (loanId: number) => Promise<Loan>;
    getBalanceDebt: (loanId: number) => Promise<BalanceDebt>;
    approveNFT: (tokenID: string, to: string) => Promise<Events>;
    ownerOfNFT: (tokenID: string) => Promise<string>;
    balanceOfCurrency: (usr: string) => Promise<Balance>;
    mintNFT: (deposit: string, tokenID: string) => Promise<Events>;
    adminAdmit: (registry: string, nft: string, principal: string, usr: string) => Promise<Events>;
    adminAppraise: (loanID: string, appraisal: string) => Promise<Events>;
    borrow: (loanID: string, to: string) => Promise<Events>;
    repay: (loan: string, wad: string, usrT: string, usr: string) => Promise<Events>;
    approveCurrency: (usr: string, wad: string) => Promise<Events>;
    lenderRely: (usr: string) => Promise<Events>;
}
export default Tinlake;
