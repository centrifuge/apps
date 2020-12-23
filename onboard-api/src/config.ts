require('dotenv').config()

export interface Config {
  db: {
    host: string
    name: string
    username: string
    port: number
    password: string
  }
  ipfsGateway: string
  tinlakeUiHost: string
  onboardApiHost: string
  rpcUrl: string
  poolRegistry: string
  sessions: {
    privateKey: string
    privateKeyPassword: string
    publicKey: string
  }
  docusign: {
    integrationKey: string
    secretKey: string
    apiUsername: string
    accountId: string
    restApiHost: string
    accountApiHost: string
    templateId: string
    rsaPrivateKey: string
  }
  securitize: {
    clientId: string
    secret: string
    apiHost: string
    idHost: string
  }
}

const config: Config = {
  db: {
    host: process.env.DB_HOST,
    name: process.env.DB_NAME,
    username: process.env.DB_USERNAME,
    port: Number(process.env.DB_PORT),
    password: process.env.DB_PASSWORD,
  },
  ipfsGateway: process.env.IPFS_GATEWAY,
  tinlakeUiHost: process.env.TINLAKE_UI_HOST,
  onboardApiHost: process.env.ONBOARD_API_HOST,
  rpcUrl: process.env.RPC_URL,
  poolRegistry: process.env.POOL_REGISTRY,
  sessions: {
    privateKey: process.env.SESSIONS_PRIVATE_KEY,
    privateKeyPassword: process.env.SESSIONS_PRIVATE_KEY_PASSWORD,
    publicKey: process.env.SESSIONS_PUBLIC_KEY,
  },
  docusign: {
    integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY,
    secretKey: process.env.DOCUSIGN_SECRET_KEY,
    apiUsername: process.env.DOCUSIGN_API_USERNAME,
    accountId: process.env.DOCUSIGN_ACCOUNT_ID,
    restApiHost: process.env.DOCUSIGN_REST_API_HOST,
    accountApiHost: process.env.DOCUSIGN_ACCOUNT_API_HOST,
    templateId: process.env.DOCUSIGN_TEMPLATE_ID,
    rsaPrivateKey: process.env.DOCUSIGN_RSA_PRIVATE_KEY,
  },
  securitize: {
    clientId: process.env.SECURITIZE_CLIENT_ID,
    secret: process.env.SECURITIZE_SECRET,
    apiHost: process.env.SECURITIZE_API_HOST,
    idHost: process.env.SECURITIZE_ID_HOST,
  },
}

export default config
