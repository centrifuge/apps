const poolConfigs = require('tinlake-pool-config')
require('dotenv').config()

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
}

const network = process.env.ETH_NETWORK || 'kovan'
const networkConfigs = poolConfigs[network === 'kovan' ? 'kovanStaging' : 'mainnetProduction']

console.log('process.env', JSON.stringify(process.env))
console.log('networkConfigs', JSON.stringify(networkConfigs))

const pool = networkConfigs.find((pool: Pool) => pool.addresses.ROOT_CONTRACT.toLowerCase() === process.env.POOL_ID.toLowerCase())

export const config: Config = {
  gatewayUrl: process.env.GATEWAY_URL,
  tinlakeUrl: process.env.TINLAKE_URL,
  rpcUrl: process.env.RPC_URL,
  ethNetwork: network,
  ethAdminAddress: process.env.ETH_ADMIN_ADDRESS,
  ethAdminPrivateKey: process.env.ETH_ADMIN_PRIVATE_KEY,
  ethBorrowerAddress: process.env.ETH_BORROWER_ADDRESS,
  ethBorrowerPrivateKey: process.env.ETH_BORROWER_PRIVATE_KEY,
  pool: pool,
  gasLimit: Number(process.env.GAS_LIMIT|| '100000') ,
  nftRegistry: process.env.NFT_REGISTRY,
}

console.log(
  `Running Tinlake end-to-end test suite:\n` +
    ` - Pool: ${pool.name || pool.shortName} (${pool.addresses.ROOT_CONTRACT})\n` +
    ` - Tinlake URL: ${config.tinlakeUrl}\n` +
    ` - Gateway URL: ${config.gatewayUrl}\n`
)

export interface Pool {
  addresses: Addresses
  slug: string
}

export interface Addresses {
  ROOT_CONTRACT: string
  ACTIONS: string
  PROXY_REGISTRY: string
}
