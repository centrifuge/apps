export type PoolStatus = 'open' | 'upcoming' | 'hidden'
export type PoolCountry = 'us' | 'non-us'
export type NonSolicitationNotice = 'all' | 'non-us' | 'none'
export type PoolMetadata = {
  pool: {
    name: string
    asset: {
      class: string
    }
    issuer: {
      logo: string
    }
    status: PoolStatus
  }
  tranches: {
    name: string
    symbol: string
  }[]
}
