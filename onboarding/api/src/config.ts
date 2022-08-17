require('dotenv').config()

export interface Config {
  db: {
    host: string
    name: string
    username: string
    port: number
    password: string
  }
  sentryDsn: string | undefined
  ipfsGateway: string
  tinlakeUiHost: string
  onboardingUiHost: string
  onboardApiHost: string
  rpcUrl: string
  poolRegistry: string
  memberAdminContractAddress: string
  signerPrivateKey: string
  globalRestrictedCountries: string[]
  sessions: {
    privateKey: string
    privateKeyPassword: string
    publicKey: string
  }
  docusign: {
    integrationKey: string
    apiUsername: string
    accountId: string
    restApiHost: string
    accountApiHost: string
    rsaPrivateKey: string
  }
  securitize: {
    clientId: string
    secret: string
    apiHost: string
    idHost: string
    domainApiHost: string
    domainApiKey: string
  }
  rwaMarket: {
    permissionManagerContractAddress: string
  }
  sendgrid: {
    whitelistEmailTemplate: string
    subscriptionAgreementTemplate: string
    kycRejectedTemplate: string
    kycManualReviewTemplate: string
    kycExpiredTemplate: string
    subscriptionAgreementVoided: string
    subscriptionAgreementDeclined: string
    apiKey: string
    apiUrl: string
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
  sentryDsn: process.env.SENTRY_DSN,
  ipfsGateway: process.env.IPFS_GATEWAY,
  tinlakeUiHost: process.env.TINLAKE_UI_HOST,
  onboardingUiHost: process.env.ONBOARDING_UI_HOST,
  onboardApiHost: process.env.ONBOARD_API_HOST,
  rpcUrl: process.env.RPC_URL,
  poolRegistry: process.env.POOL_REGISTRY,
  memberAdminContractAddress: process.env.MEMBER_ADMIN_CONTRACT_ADDRESS,
  signerPrivateKey: process.env.SIGNER_PRIVATE_KEY,
  globalRestrictedCountries: (process.env.GLOBAL_RESTRICTED_COUNTRIES || '').split(','),
  sessions: {
    privateKey: process.env.SESSIONS_PRIVATE_KEY,
    privateKeyPassword: process.env.SESSIONS_PRIVATE_KEY_PASSWORD,
    publicKey: process.env.SESSIONS_PUBLIC_KEY,
  },
  docusign: {
    integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY,
    apiUsername: process.env.DOCUSIGN_API_USERNAME,
    accountId: process.env.DOCUSIGN_ACCOUNT_ID,
    restApiHost: process.env.DOCUSIGN_REST_API_HOST,
    accountApiHost: process.env.DOCUSIGN_ACCOUNT_API_HOST,
    rsaPrivateKey: process.env.DOCUSIGN_RSA_PRIVATE_KEY,
  },
  securitize: {
    clientId: process.env.SECURITIZE_CLIENT_ID,
    secret: process.env.SECURITIZE_SECRET,
    apiHost: process.env.SECURITIZE_API_HOST,
    idHost: process.env.SECURITIZE_ID_HOST,
    domainApiHost: process.env.SECURITIZE_DOMAIN_API_HOST,
    domainApiKey: process.env.SECURITIZE_DOMAIN_API_KEY,
  },
  rwaMarket: {
    permissionManagerContractAddress: process.env.RWA_MARKET_PERMISSION_MANAGER_CONTRACT_ADDRESS,
  },
  sendgrid: {
    whitelistEmailTemplate: `d-a0e7c096a0cf43868de275751e57fdf5`,
    subscriptionAgreementTemplate: `d-4ba3d74ecffd490eb3a5d616b6854d57`,
    kycRejectedTemplate: `d-0355a8a15020445fb0d785ad75420ece`,
    kycManualReviewTemplate: `d-014ba55571fe42029fc23bae5f06c1c0`,
    kycExpiredTemplate: `d-74720622817b46be96c0a4e8ee7e8238`,
    subscriptionAgreementVoided: `d-e8610d07f0064730ac48cfd1edff84a1`,
    subscriptionAgreementDeclined: `d-50fac35e88fc4468b1bd1aba78cfedd0`,
    apiKey: process.env.SENDGRID_API_KEY,
    apiUrl: `https://api.sendgrid.com/v3/mail/send`,
  },
}

export default config
