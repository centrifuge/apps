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
    'collateral': any;
    'pile': any;
    'pileForAdd': any;
    'pileForInit': any;
    'admin': any;
    'nftData': any;
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
    'ADMIN': string;
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
    collateral: any;
    pile: any;
    pileForAdd: any;
    pileForInit: any;
    admin: any;
    nftData: any;
}
interface ethI {
    web3_sha3: (signature: string) => string;
    getTransactionReceipt: (arg0: any, arg1: (err: any, receipt: any) => void) => void;
    getTransactionByHash: (arg0: any, arg1: (err: any, tx: any) => void) => void;
    contract: (arg0: any) => {
        at: (arg0: any) => void;
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
export interface AbiOutput {
    name: string;
    type: 'uint265' | 'address';
}
export declare const LOAN_ID_IDX = 2;
export declare class Tinlake {
    provider: any;
    eth: ethI;
    ethOptions: any;
    ethConfig: any;
    contractAddresses: ContractAddresses;
    transactionTimeout: number;
    contracts: Contracts;
    contractAbis: ContractAbis;
    constructor(provider: any, contractAddresses: ContractAddresses, nftDataOutputs: AbiOutput[], transactionTimeout: number, { contractAbis, ethOptions, ethConfig }?: Options);
    setProvider: (provider: any, ethOptions?: any) => void;
    setEthConfig: (ethConfig: {
        [key: string]: any;
    }) => void;
    isAdmin: (address: string) => Promise<boolean>;
    loanCount: () => Promise<BN>;
    getLoan: (loanId: string) => Promise<Loan>;
    getBalanceDebt: (loanId: string) => Promise<BalanceDebt>;
    approveNFT: (tokenId: string, to: string) => Promise<unknown>;
    approveCollateral: (usr: string, wad: string) => Promise<unknown>;
    ownerOfNFT: (tokenId: string) => Promise<any>;
    ownerOfLoan: (loanId: string) => Promise<any>;
    balanceOfCurrency: (usr: string) => Promise<any>;
    mintCurrency: (usr: string, wad: string) => Promise<unknown>;
    /**
     * @param owner Owner of the new NFT
     */
    mintNFT: (owner: string, tokenId: string) => Promise<any>;
    /**
     * @param owner Owner of the created loan
     */
    adminAdmit: (registry: string, nft: string, principal: string, owner: string) => Promise<unknown>;
    adminAppraise: (loanID: string, appraisal: string) => Promise<unknown>;
    getAppraisal: (loanID: string) => Promise<any>;
    /**
     * @param to Address that should receive the currency (e. g. DAI)
     */
    borrow: (loanId: string, to: string) => Promise<unknown>;
    /**
     * @param wad Amount which should be repaid
     * @param usr Address that receives the NFT
     */
    repay: (loanId: string, wad: string, usr: string) => Promise<unknown>;
    /**
     * @param wad Amount which should be repaid
     * @param usr Address that receives the NFT
     */
    close: (loanId: string, usr: string) => Promise<unknown>;
    approveCurrency: (usr: string, wad: string) => Promise<unknown>;
    lenderRely: (usr: string) => Promise<unknown>;
    initFee: (fee: string) => Promise<unknown>;
    existsFee: (fee: string) => Promise<boolean>;
    addFee: (loanId: string, fee: string, balance: string) => Promise<unknown>;
    getCurrentDebt: (loanId: string) => Promise<BN>;
    /**
     * whitelist is a shortcut contract that calls adminAdmit (admit.admit),
     * adminAppraise (appraiser.file) and addFee (pile.file) to prevent additional
     * transactions. It is required though that the fee is already initialized
     * using initFee
     * @param owner Owner of the created loan
     */
    whitelist: (registry: string, nft: string, principal: string, appraisal: string, fee: string, owner: string) => Promise<unknown>;
    unwhitelist: (loanId: string, registry: string, nft: string) => Promise<unknown>;
    getTotalDebt: () => Promise<BN>;
    getTotalBalance: () => Promise<BN>;
    getTotalValueOfNFTs: () => Promise<BN>;
    getNFTData: <T>(tokenId: string) => Promise<T>;
}
export default Tinlake;
export * from './utils/baseToDisplay';
export * from './utils/bnToHex';
export * from './utils/displayToBase';
export * from './utils/feeToInterestRate';
export * from './utils/getLoanStatus';
export * from './utils/interestRateToFee';
