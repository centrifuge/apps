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

export const config: Config = {
  gatewayUrl: process.env.GATEWAY_URL,
  tinlakeUrl: process.env.TINLAKE_URL,
  rpcUrl: process.env.RPC_URL,
  ethNetwork: process.env.ETH_NETWORK || 'kovan',
  ethAdminAddress: process.env.ETH_ADMIN_ADDRESS,
  ethAdminPrivateKey: process.env.ETH_ADMIN_PRIVATE_KEY,
  ethBorrowerAddress: process.env.ETH_BORROWER_ADDRESS,
  ethBorrowerPrivateKey: process.env.ETH_BORROWER_PRIVATE_KEY,
  pool: JSON.parse(process.env.TINLAKE_POOL),
  gasLimit: Number(process.env.GAS_LIMIT|| '100000') ,
  nftRegistry: process.env.NFT_REGISTRY,
}

export interface Pool {
  addresses: Addresses
  slug: string
}

export interface Addresses {
  ROOT_CONTRACT: string
  ACTIONS: string
  PROXY_REGISTRY: string
}
