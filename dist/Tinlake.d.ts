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
    constructor(provider: any, contractAddresses: ContractAddresses, { contractAbis, ethOptions, ethConfig }?: Options);
    loanCount: () => Promise<BN>;
    getLoan: (loanId: string) => Promise<Loan>;
    getBalanceDebt: (loanId: string) => Promise<BalanceDebt>;
    approveNFT: (tokenId: string, to: string) => Promise<Events>;
    ownerOfNFT: (tokenId: string) => Promise<string>;
    ownerOfLoan: (loanId: string) => Promise<string>;
    balanceOfCurrency: (usr: string) => Promise<Balance>;
    /**
     * @param owner Owner of the new NFT
     */
    mintNFT: (owner: string, tokenId: string) => Promise<Events>;
    /**
     * @param owner Owner of the created loan
     */
    adminAdmit: (registry: string, nft: string, principal: string, owner: string) => Promise<Events>;
    adminAppraise: (loanID: string, appraisal: string) => Promise<Events>;
    /**
     * @param to Address that should receive the currency (e. g. DAI)
     */
    borrow: (loanId: string, to: string) => Promise<Events>;
    /**
     * @param from Address that pays back the currency (e. g. DAI)
     * @param to Address that receives the NFT
     */
    repay: (loanId: string, wad: string, from: string, to: string) => Promise<Events>;
    approveCurrency: (usr: string, wad: string) => Promise<Events>;
    lenderRely: (usr: string) => Promise<Events>;
}
export default Tinlake;
