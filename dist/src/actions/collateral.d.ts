import { Constructor, Tinlake } from '../types';
import BN from 'bn.js';
export declare function CollateralActions<ActionsBase extends Constructor<Tinlake>>(Base: ActionsBase): {
    new (...args: any[]): {
        mintTitleNFT: (user: string) => Promise<any>;
        mintNFT: (owner: string, tokenId: string, ref: string, amount: string, asset: string) => Promise<unknown>;
        approveNFT: (tokenId: string, to: string) => Promise<unknown>;
        getNFTCount: () => Promise<BN>;
        getNFTData: (tokenId: string) => Promise<any>;
        getNFTOwner: (tokenId: string) => Promise<BN>;
        transferNFT: (from: string, to: string, tokenId: string) => Promise<unknown>;
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
export declare type ICollateralActions = {
    mintTitleNFT(usr: string): Promise<any>;
    mintNFT(owner: string, tokenId: string, ref: string, amount: string, asset: string): Promise<any>;
    approveNFT(tokenId: string, to: string): Promise<any>;
    getNFTCount(): Promise<BN>;
    getNFTData(tokenId: string): Promise<any>;
    getNFTOwner(tokenId: string): Promise<BN>;
    transferNFT(from: string, to: string, tokenId: string): Promise<any>;
};
export default CollateralActions;
