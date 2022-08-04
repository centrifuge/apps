export type PoolStatus = 'open' | 'upcoming' | 'hidden'
export type PoolCountry = 'us' | 'non-us'
export type NonSolicitationNotice = 'all' | 'non-us' | 'none'

type Attribute =
  | {
      label: string
      type: 'decimal'
    }
  | {
      label: string
      type: 'timestamp'
    }
  | {
      label: string
      type: 'currency'
      currencySymbol: string
      currencyDecimals: number
    }
  | {
      label: string
      type: 'string'
      displayType: 'single-select'
      options: string[]
    }
  | {
      label: string
      type: 'string'
      multiline?: boolean
    }
  | {
      label: string
      type: 'percentage'
    }

type Section = {
  name: string
  public: boolean
  attributes: Attribute[]
}

export type Schema = {
  name: string
  options: {
    assetClasses: string[]
    loanTypes: ('BulletLoan' | 'CreditLine' | 'CreditLineWithMaturity')[]
    description: boolean
    image: boolean
  }
  sections: Section[]
}

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
  schemas?: {
    id: string
    createdAt: string
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
