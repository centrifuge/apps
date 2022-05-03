export type PoolStatus = 'open' | 'upcoming' | 'hidden'
export type PoolCountry = 'us' | 'non-us'
export type NonSolicitationNotice = 'all' | 'non-us' | 'none'
export type PoolMetadata = {
  pool: {
    name: string
    icon: string
    asset: {
      class: string
    }
    issuer: {
      name: string
      description: string
      email: string
      logo: string
    }
    links: {
      executiveSummary: string
      forum: string
      website: string
    }
    status: PoolStatus
  }
  tranches: {
    name: string
    symbol: string
  }[]
  riskGroups: {
    name: string | undefined
    advanceRate: number
    financingFee: number
    probabilityOfDefault: number
    lossGivenDefault: number
    discountRate: number
  }[]
}
