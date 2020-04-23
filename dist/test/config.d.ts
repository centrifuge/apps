declare const testConfig: {
    nftDataContractCall: {
        outputs: {
            name: string;
            type: string;
        }[];
        displayedFields: {
            key: string;
            label: string;
            type: string;
            decimals: number;
            precision: number;
            suffix: string;
        }[];
    };
    allAddresses: {
        DEPLOYMENT_NAME: string;
        ROOT_CONTRACT: string;
        TINLAKE_CURRENCY: string;
        LENDER_DEPLOYER: string;
        OPERATOR_FAB: string;
        ASSESSOR_FAB: string;
        DISTRIBUTOR_FAB: string;
        TRANCHE_FAB: string;
        SENIOR_TRANCHE_FAB: string;
        SENIOR_OPERATOR_FAB: string;
        JUNIOR_OPERATOR: string;
        JUNIOR: string;
        JUNIOR_TOKEN: string;
        SENIOR: string;
        SENIOR_TOKEN: string;
        SENIOR_OPERATOR: string;
        DISTRIBUTOR: string;
        ASSESSOR: string;
        BORROWER_DEPLOYER: string;
        TITLE_FAB: string;
        SHELF_FAB: string;
        PILE_FAB: string;
        COLLECTOR_FAB: string;
        THRESHOLD_FAB: string;
        PRICEPOOL_FAB: string;
        CEILING_FAB: string;
        TITLE: string;
        PILE: string;
        SHELF: string;
        CEILING: string;
        COLLECTOR: string;
        THRESHOLD: string;
        PRICE_POOL: string;
        GOVERNANCE: string;
    };
    contractAddresses: {
        ROOT_CONTRACT: string;
    };
    godAccount: {
        address: string;
        publicKey: string;
        privateKey: string;
    };
    transactionTimeout: number;
    gasPrice: number;
    gasLimit: number;
    rpcUrl: string;
    contractAbis: import("../Tinlake").ContractAbis;
    SUCCESS_STATUS: string;
    FAIL_STATUS: string;
    FAUCET_AMOUNT: string;
};
export default testConfig;
