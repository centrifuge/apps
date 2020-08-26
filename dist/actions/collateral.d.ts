import { Constructor, TinlakeParams, PendingTransaction } from '../Tinlake';
import BN from 'bn.js';
/**
 * - See if we can remove ICollateralActions,
 * - Make sure all actions have a non-unkonwn/any return type
//  * - Remove contractKey
//  * - Remove timesOutAt from every action (use this.transactionTimeout)
//  * - Create ticket for adding RetryProvider later in tinlake-ui
 * - Create issue in ethers.js for window is undefined error
 */
export declare function CollateralActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase): {
    new (...args: any[]): {
        mintTitleNFT: (nftAddr: string, user: string) => Promise<any>;
        mintNFT: (nftAddress: string, owner: string, tokenId: string, ref: string, amount: string, asset: string) => Promise<PendingTransaction>;
        approveNFT: (nftAddr: string, tokenId: string, to: string) => Promise<unknown>;
        setNFTApprovalForAll: (nftAddr: string, to: string, approved: boolean) => Promise<PendingTransaction>;
        isNFTApprovedForAll: (nftAddr: string, owner: string, operator: string) => Promise<any>;
        getNFTCount: (nftAddr: string) => Promise<BN>;
        getNFTData: (nftAddr: string, tokenId: string) => Promise<any>;
        getNFTOwner: (nftAddr: string, tokenId: string) => Promise<BN>;
        transferNFT: (nftAddr: string, from: string, to: string, tokenId: string) => Promise<unknown>;
        provider: any;
        eth: import("../services/ethereum").ethI;
        ethOptions: any;
        ethConfig: import("../Tinlake").EthConfig;
        ethersConfig: import("../Tinlake").EthersConfig;
        contractAddresses: import("../Tinlake").ContractAddresses;
        transactionTimeout: number;
        contracts: import("../Tinlake").Contracts;
        ethersContracts: import("../Tinlake").Contracts;
        contractAbis: import("../Tinlake").ContractAbis;
        contractConfig: any;
        setProvider: (provider: any, ethOptions?: any) => void;
        setContracts: () => void;
        setEthConfig: (ethConfig: import("../Tinlake").EthConfig) => void;
        setEthersConfig: (ethersConfig: import("../Tinlake").EthersConfig | undefined) => void;
        createEthContract(address: string, abiName: "TINLAKE_CURRENCY" | "JUNIOR_OPERATOR" | "JUNIOR" | "JUNIOR_TOKEN" | "SENIOR" | "SENIOR_TOKEN" | "SENIOR_OPERATOR" | "DISTRIBUTOR" | "ASSESSOR" | "TITLE" | "PILE" | "SHELF" | "CEILING" | "COLLECTOR" | "THRESHOLD" | "PRICE_POOL" | "COLLATERAL_NFT" | "COLLATERAL_NFT_DATA" | "ROOT_CONTRACT" | "PROXY" | "PROXY_REGISTRY" | "ACTIONS" | "BORROWER_DEPLOYER" | "LENDER_DEPLOYER" | "NFT_FEED" | "GOVERNANCE" | "ALLOWANCE_OPERATOR"): void;
        createContract(address: string, abiName: "TINLAKE_CURRENCY" | "JUNIOR_OPERATOR" | "JUNIOR" | "JUNIOR_TOKEN" | "SENIOR" | "SENIOR_TOKEN" | "SENIOR_OPERATOR" | "DISTRIBUTOR" | "ASSESSOR" | "TITLE" | "PILE" | "SHELF" | "CEILING" | "COLLECTOR" | "THRESHOLD" | "PRICE_POOL" | "COLLATERAL_NFT" | "COLLATERAL_NFT_DATA" | "ROOT_CONTRACT" | "PROXY" | "PROXY_REGISTRY" | "ACTIONS" | "BORROWER_DEPLOYER" | "LENDER_DEPLOYER" | "NFT_FEED" | "GOVERNANCE" | "ALLOWANCE_OPERATOR"): import("ethers").Contract;
        getContract(address: string, abiName: "TINLAKE_CURRENCY" | "JUNIOR_OPERATOR" | "JUNIOR" | "JUNIOR_TOKEN" | "SENIOR" | "SENIOR_TOKEN" | "SENIOR_OPERATOR" | "DISTRIBUTOR" | "ASSESSOR" | "TITLE" | "PILE" | "SHELF" | "CEILING" | "COLLECTOR" | "THRESHOLD" | "PRICE_POOL" | "COLLATERAL_NFT" | "COLLATERAL_NFT_DATA" | "ROOT_CONTRACT" | "PROXY" | "PROXY_REGISTRY" | "ACTIONS" | "BORROWER_DEPLOYER" | "LENDER_DEPLOYER" | "NFT_FEED" | "GOVERNANCE" | "ALLOWANCE_OPERATOR"): import("ethers").Contract;
        contract(abiName: "TINLAKE_CURRENCY" | "JUNIOR_OPERATOR" | "JUNIOR" | "JUNIOR_TOKEN" | "SENIOR" | "SENIOR_TOKEN" | "SENIOR_OPERATOR" | "DISTRIBUTOR" | "ASSESSOR" | "TITLE" | "PILE" | "SHELF" | "CEILING" | "COLLECTOR" | "THRESHOLD" | "PRICE_POOL" | "COLLATERAL_NFT" | "COLLATERAL_NFT_DATA" | "ROOT_CONTRACT" | "PROXY" | "PROXY_REGISTRY" | "ACTIONS" | "BORROWER_DEPLOYER" | "LENDER_DEPLOYER" | "NFT_FEED" | "GOVERNANCE" | "ALLOWANCE_OPERATOR", address?: string | undefined): import("ethers").Contract;
        pending(txPromise: Promise<import("ethers/providers").TransactionResponse>): Promise<PendingTransaction>;
        getTransactionReceipt(tx: PendingTransaction): Promise<import("ethers/providers").TransactionReceipt>;
        getOperatorType: (tranche: string) => any;
    };
} & ActionsBase;
export declare type ICollateralActions = {
    mintTitleNFT(nftAddr: string, usr: string): Promise<any>;
    mintNFT(nftAddr: string, owner: string, tokenId: string, ref: string, amount: string, asset: string): Promise<PendingTransaction>;
    approveNFT(nftAddr: string, tokenId: string, to: string): Promise<any>;
    setNFTApprovalForAll(nftAddr: string, to: string, approved: boolean): Promise<PendingTransaction>;
    isNFTApprovedForAll(nftAddr: string, owner: string, operator: string): Promise<boolean>;
    getNFTCount(nftAddr: string): Promise<BN>;
    getNFTData(nftAddr: string, tokenId: string): Promise<any>;
    getNFTOwner(nftAddr: string, tokenId: string): Promise<BN>;
    transferNFT(nftAddr: string, from: string, to: string, tokenId: string): Promise<any>;
};
export default CollateralActions;
