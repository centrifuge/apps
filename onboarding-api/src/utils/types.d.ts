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
      INFURA_KEY: string
      EVM_NETWORK: string
      EVM_MEMBERLIST_ADMIN_PRIVATE_KEY: string
      PURE_PROXY_CONTROLLER_SEED: string
      ONBOARDING_STORAGE_BUCKET: string
    }
  }
}

type VerificationState = 1 | 0 | null

export type ManualKybCallbackRequestBody = {
  reference: `MANUAL_KYB_REFERENCE_${string}`
  event:
    | `request.${'pending' | 'timeout' | 'deleted' | 'received'}`
    | 'review.pending'
    | `verification.${'accepted' | 'declined' | 'cancelled' | 'status.changed'}`
  verification_url: `https://app.shuftipro.com/verification/process/${string}`
  email: string
  country: string

  /**
   * This object will be returned in case of verification.accepted or verification.declined.
   * This object will include all the gathered data in a request process.
   */
  verification_data?: unknown
  verification_result?: {
    proof_stores: {
      articles_of_association: VerificationState
      certificate_of_incorporation: VerificationState
      proof_of_address: VerificationState
      register_of_directors: VerificationState
      register_of_shareholders: VerificationState
      signed_and_dated_ownership_structure: VerificationState
    }
  }
}
