declare const testConfig: {
    contractAddresses: any;
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
