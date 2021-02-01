require('dotenv').config()

export interface Config {
  ipfsGateway: string
  rpcUrl: string
  poolRegistry: string
  signerPrivateKey: string
  slackWebhookUrl: string
}

const config: Config = {
  ipfsGateway: process.env.IPFS_GATEWAY,
  rpcUrl: process.env.RPC_URL,
  poolRegistry: process.env.POOL_REGISTRY,
  signerPrivateKey: process.env.SIGNER_PRIVATE_KEY,
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
}

export default config
