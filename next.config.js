const withTypescript = require('@zeit/next-typescript');
const { parsed: localEnv } = require('dotenv').config()

module.exports = withTypescript({
  webpack(config, options) {
    // Further custom configuration here
    return config;
  },
  publicRuntimeConfig: {
    TINLAKE_ADDRESSES: process.env.TINLAKE_ADDRESSES,
    NFT_DATA_DEFINITION: process.env.NFT_DATA_DEFINITION,
    RPC_URL: process.env.RPC_URL,
    TINLAKE_DATA_BACKEND_URL: process.env.TINLAKE_DATA_BACKEND_URL,
    TRANSACTION_TIMEOUT: process.env.TRANSACTION_TIMEOUT,
    ENV: process.env.ENV
  }
});