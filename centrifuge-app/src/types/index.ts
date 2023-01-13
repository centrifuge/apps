export type PoolStatus = 'open' | 'upcoming' | 'hidden'
export type PoolCountry = 'us' | 'non-us'
export type NonSolicitationNotice = 'all' | 'non-us' | 'none'

export type LoanTemplateAttribute =
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
  attributes: LoanTemplateAttribute[]
}

export type LoanTemplate = {
  name: string
  options: {
    assetClasses: string[]
    loanTypes: ('BulletLoan' | 'CreditLine' | 'CreditLineWithMaturity')[]
    description: boolean
    image: boolean
  }
  sections: Section[]
}

export type InvestorTypes = 'individual' | 'entity'

export type ultimateBeneficialOwner = {
  name: string
}
