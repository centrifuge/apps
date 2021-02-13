require('dotenv').config()

export interface Config {
  ipfsGateway: string
  rpcUrl: string
  poolRegistry: string
  signerEncryptedJson: string
  signerPassword: string
  slackWebhookUrl: string
  tinlakeUiHost: string
  etherscanUrl: string
  tinlakeDataBackendUrl: string
}

const config: Config = {
  ipfsGateway: process.env.IPFS_GATEWAY,
  rpcUrl: process.env.RPC_URL,
  poolRegistry: process.env.POOL_REGISTRY,
  signerEncryptedJson: process.env.SIGNER_ENCRYPTED_JSON,
  signerPassword: process.env.SIGNER_PASSWORD,
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
  tinlakeUiHost: process.env.TINLAKE_UI_HOST,
  etherscanUrl: process.env.ETHERSCAN_URL,
  tinlakeDataBackendUrl: process.env.TINLAKE_DATA_BACKEND_URL,
}

export default config
