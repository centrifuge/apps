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
    contractAbiPath?: string;
    contractAddresses?: ContractAddresses;
    ethOptions?: any;
    ethConfig?: any;
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
declare class Tinlake {
    private contractAbiPath;
    private contractAddresses;
    private provider;
    private ethOptions;
    private ethConfig;
    private eth;
    private contracts;
    constructor(provider: any, { contractAbiPath, contractAddresses, ethOptions, ethConfig }?: Options);
    approveNFT: (tokenID: string, to: string) => Promise<Events>;
    ownerOfNFT: (tokenID: string) => Promise<Events>;
    balanceOfCurrency: (usr: string) => Promise<Balance>;
    mintNFT: (deposit: string, tokenID: string) => Promise<Events>;
    adminAdmit: (registry: string, nft: string, principal: number, usr: string) => Promise<Events>;
    adminAppraise: (loanID: string, appraisal: number) => Promise<Events>;
    borrow: (loanID: string, to: string) => Promise<Events>;
    repay: (loan: string, wad: number, usrT: string, usr: string) => Promise<Events>;
    approveCurrency: (usr: string, wad: number) => Promise<Events>;
    lenderRely: (usr: string) => Promise<Events>;
}
export default Tinlake;
