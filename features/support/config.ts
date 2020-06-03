require('dotenv').config()

export interface Config {
  gatewayUrl: string,
  tinlakeUrl: string,
  rpcUrl: string,
  ethNetwork: string,
  ethAdminAddress: string,
  ethAdminPrivateKey: string,
  tinlakePool: Pool,
  gasLimit: number,
}

export const config: Config = {
  gatewayUrl: process.env.GATEWAY_URL,
  tinlakeUrl: process.env.TINLAKE_URL,
  rpcUrl: process.env.RPC_URL,
  ethNetwork: process.env.ETH_NETWORK,
  ethAdminAddress: process.env.ETH_ADMIN_ADDRESS,
  ethAdminPrivateKey: process.env.ETH_ADMIN_PRIVATE_KEY,
  tinlakePool: JSON.parse(process.env.TINLAKE_POOL),
  gasLimit: 100000,
}

export interface Pool {
  addresses:      Addresses;
  contractConfig: ContractConfig;
}

export interface Addresses {
  ROOT_CONTRACT:  string;
  ACTIONS:        string;
  PROXY_REGISTRY: string;
}

export interface ContractConfig {
  JUNIOR_OPERATOR: string;
  SENIOR_OPERATOR: string;
}

