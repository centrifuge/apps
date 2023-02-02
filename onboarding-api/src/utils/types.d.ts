export type Subset<K> = {
  [attr in keyof K]?: K[attr] extends object
    ? Subset<K[attr]>
    : K[attr] extends object | null
    ? Subset<K[attr]> | null
    : K[attr] extends object | null | undefined
    ? Subset<K[attr]> | null | undefined
    : K[attr]
}

export {}

declare global {
  export namespace Express {
    export interface Request {
      walletAddress: string
    }
  }
  declare namespace NodeJS {
    interface ProcessEnv {
      SHUFTI_PRO_SECRET_KEY: string
      SHUFTI_PRO_CLIENT_ID: string
      JWT_SECRET: string
      REDIRECT_URL: string
      SENDGRID_API_KEY: string
    }
  }
}
