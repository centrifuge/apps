const mainnetPools = require('@centrifuge/tinlake-pools-mainnet')
const kovanPools = require('@centrifuge/tinlake-pools-kovan')
const localPool = require('../subgraph/pools-metadata.json')
require('dotenv').config()

const localPools = [localPool];
//localPools[localPool.addresses.ROOT_CONTRACT] = localPool;

export interface Config {
  gatewayUrl: string
  tinlakeUrl: string
  rpcUrl: string
  ethNetwork: string
  ethAdminAddress: string
  ethAdminPrivateKey: string
  ethBorrowerAddress: string
  ethBorrowerPrivateKey: string
  pool: Pool
  gasLimit: number
  nftRegistry: string
  transactionTimeout: number
}

const network = process.env.ETH_NETWORK || 'kovan'
const networkConfigs = network === 'mainnet' ? mainnetPools : network === 'kovan' ? kovanPools : localPools

const pool = networkConfigs.find(
  (pool: Pool) => pool.addresses.ROOT_CONTRACT.toLowerCase() === process.env.POOL_ID?.toLowerCase()
)

export const config: Config = {
  gatewayUrl: process.env.GATEWAY_URL || 'https://gateway.amber.centrifuge.io/',
  tinlakeUrl: process.env.TINLAKE_URL || 'https://kovan.staging.tinlake.centrifuge.io/',
  rpcUrl: process.env.RPC_URL || '',
  ethNetwork: network,
  ethAdminAddress: process.env.ETH_ADMIN_ADDRESS || '',
  ethAdminPrivateKey: process.env.ETH_ADMIN_PRIVATE_KEY || '',
  ethBorrowerAddress: process.env.ETH_BORROWER_ADDRESS || '',
  ethBorrowerPrivateKey: process.env.ETH_BORROWER_PRIVATE_KEY || '',
  pool: pool,
  gasLimit: Number(process.env.GAS_LIMIT || '100000'),
  nftRegistry: process.env.NFT_REGISTRY || '',
  transactionTimeout: Number(process.env.TRANSACTION_TIMEOUT || '30000'),
}

console.log(
  `Running Tinlake end-to-end test suite:\n` +
    ` - Pool: ${pool.metadata.shortName || pool.metadata.name} (${pool.addresses.ROOT_CONTRACT})\n` +
    ` - Tinlake URL: ${config.tinlakeUrl}\n` +
    ` - Gateway URL: ${config.gatewayUrl}\n`
)

export interface Pool {
  addresses: Addresses
  metadata: {
    slug: string
  }
}

export interface Addresses {
  ROOT_CONTRACT: string
  ACTIONS: string
  PROXY_REGISTRY: string
}
