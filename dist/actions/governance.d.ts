import { Constructor, TinlakeParams } from '../Tinlake';
declare function GovernanceActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase): {
    new (...args: any[]): {
        relyAddress: (usr: string, contractAddress: string) => Promise<unknown>;
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
        pending(txPromise: Promise<import("ethers/providers").TransactionResponse>): Promise<import("../Tinlake").PendingTransaction>;
        getTransactionReceipt(tx: import("../Tinlake").PendingTransaction): Promise<import("ethers/providers").TransactionReceipt>;
        getOperatorType: (tranche: string) => any;
    };
} & ActionsBase;
export declare type IGovernanceActions = {
    relyAddress(usr: string, contractAddress: string): Promise<any>;
};
export default GovernanceActions;
