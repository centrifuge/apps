import { SupportedNetworks } from '../database'

export type Subset<K> = {
  [attr in keyof K]?: K[attr] extends object
    ? Subset<K[attr]>
    : K[attr] extends object | null
    ? Subset<K[attr]> | null
    : K[attr] extends object | null | undefined
    ? Subset<K[attr]> | null | undefined
    : K[attr]
}

declare global {
  export namespace Express {
    export interface Request {
      wallet: {
        address: string
        network: SupportedNetworks
        chainId: number
      }
    }
  }
  export namespace NodeJS {
    export interface ProcessEnv {
      SHUFTI_PRO_SECRET_KEY: string
      SHUFTI_PRO_CLIENT_ID: string
      JWT_SECRET: string
      REDIRECT_URL: string
      SENDGRID_API_KEY: string
      MEMBERLIST_ADMIN_PURE_PROXY: string
      COLLATOR_WSS_URL: string
      RELAY_WSS_URL: string
      INFURA_KEY: string
      EVM_NETWORK: string
      EVM_MEMBERLIST_ADMIN_PRIVATE_KEY: string
      PURE_PROXY_CONTROLLER_SEED: string
      ONBOARDING_STORAGE_BUCKET: string
      EVM_ON_SUBSTRATE_CHAIN_ID: string
    }
  }
}
