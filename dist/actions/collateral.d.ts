import { Constructor, TinlakeParams } from '../Tinlake';
import BN from 'bn.js';
export declare function CollateralActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase): {
    new (...args: any[]): {
        mintTitleNFT: (nftAddr: string, user: string) => Promise<any>;
        mintNFT: (nftAddr: string, owner: string, tokenId: string, ref: string, amount: string, asset: string) => Promise<unknown>;
        approveNFT: (nftAddr: string, tokenId: string, to: string) => Promise<unknown>;
        getNFTCount: (nftAddr: string) => Promise<BN>;
        getNFTData: (nftAddr: string, tokenId: string) => Promise<any>;
        getNFTOwner: (nftAddr: string, tokenId: string) => Promise<BN>;
        transferNFT: (nftAddr: string, from: string, to: string, tokenId: string) => Promise<unknown>;
        provider: any;
        eth: import("../services/ethereum").ethI;
        ethOptions: any;
        ethConfig: {} | import("../Tinlake").EthConfig;
        contractAddresses: import("../Tinlake").ContractAddresses;
        transactionTimeout: number;
        contracts: import("../Tinlake").Contracts;
        contractAbis: import("../Tinlake").ContractAbis;
        contractConfig: any;
        setProvider: (provider: any, ethOptions?: any) => void;
        setEthConfig: (ethConfig: {} | import("../Tinlake").EthConfig) => void;
        setContractAddresses: () => Promise<void>;
        createContract(address: string, abiName: string): void;
        getOperatorType: (tranche: string) => any;
    };
} & ActionsBase;
export declare type ICollateralActions = {
    mintTitleNFT(nftAddr: string, usr: string): Promise<any>;
    mintNFT(nftAddr: string, owner: string, tokenId: string, ref: string, amount: string, asset: string): Promise<any>;
    approveNFT(nftAddr: string, tokenId: string, to: string): Promise<any>;
    getNFTCount(nftAddr: string): Promise<BN>;
    getNFTData(nftAddr: string, tokenId: string): Promise<any>;
    getNFTOwner(nftAddr: string, tokenId: string): Promise<BN>;
    transferNFT(nftAddr: string, from: string, to: string, tokenId: string): Promise<any>;
};
export default CollateralActions;
