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
  tranches: Record<
    string,
    {
      name: string
      symbol: string
      minInitialInvestment: string
    }
  >
  riskGroups: {
    name: string | undefined
    advanceRate: string
    interestRatePerSec: string
    probabilityOfDefault: string
    lossGivenDefault: string
    discountRate: string
  }[]
  // Not yet implemented
  // onboarding: {
  //   live: boolean
  //   agreements: {
  //     name: string
  //     provider: 'docusign'
  //     providerTemplateId: string
  //     tranche: string
  //     country: 'us | non-us'
  //   }[]
  //   issuer: {
  //     name: string
  //     email: string
  //     restrictedCountryCodes: string[]
  //     minInvestmentCurrency: number
  //     nonSolicitationNotice: 'all' | 'non-us' | 'none'
  //   }
  // }
  // bot: {
  //   channelId: string
  // }
}
