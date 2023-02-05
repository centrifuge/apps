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

export type UltimateBeneficialOwner = {
  name: string
  dateOfBirth: string
}

type IndividualUserSteps = {
  verifyTaxInfo: {
    completed: boolean
    timeStamp: string
  }
  verifyAccreditation: {
    completed: boolean | null
    timeStamp: string | null
  }
  verifyIdentity: {
    completed: boolean
    timeStamp: string
  }
  signAgreements: {
    [poolId: string]: {
      [trancheId: string]: {
        completed: boolean
        timeStamp: string
      }
    }
  }
}

export interface EntityOnboardingSteps extends IndividualUserSteps {
  verifyBusiness: {
    completed: boolean
    timeStamp: string
  }
  verifyEmail: {
    completed: boolean
    timeStamp: string
  }
  confirmOwners: {
    completed: boolean
    timeStamp: string
  }
}

export type EntityUser = {
  investorType: 'entity'
  walletAddress: string
  businessName: string
  email: string
  incorporationDate: string
  jurisdictionCode: string
  registrationNumber: number
  ultimateBeneficialOwners: UltimateBeneficialOwner[]
  steps: EntityOnboardingSteps
  name: string
  dateOfBirth: string
  countryOfCitizenship: string
}

type IndividualUser = {
  investorType: 'individual'
  walletAddress: string
  name: string
  dateOfBirth: string
  countryOfCitizenship: string
  steps: IndividualUserSteps
}

export type OnboardingUser = IndividualUser | EntityUser
