var HDWalletProvider = require("truffle-hdwallet-provider");

let account = process.env.ETH_FROM
let endpoint = process.env.ETH_RPC_URL
let privateKey = process.env.ETH_PRIVATE_KEY

module.exports = {
    compilers: {
        solc: {
            version: "0.5.3",
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 200,
                }
            }
        },
    },
    networks: {
        parity: {
            provider: new HDWalletProvider(privateKey, endpoint),
            port: 8545,
            network_id: "*", // match any
            from: account,
        }
    }
};
