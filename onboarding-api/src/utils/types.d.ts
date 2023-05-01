export type Subset<K> = {
  [attr in keyof K]?: K[attr] extends object
    ? Subset<K[attr]>
    : K[attr] extends object | null
    ? Subset<K[attr]> | null
    : K[attr] extends object | null | undefined
    ? Subset<K[attr]> | null | undefined
    : K[attr]
}

export type SupportedNetworks = 'substrate' | 'evm'

declare global {
  export namespace Express {
    export interface Request {
      wallet: {
        address: string
        network: SupportedNetworks
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
      ONBOARDING_API_URL: string
    }
  }
}
