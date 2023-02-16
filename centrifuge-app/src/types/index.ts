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
    timeStamp: string | null
  }
  verifyAccreditation: {
    completed: boolean | null
    timeStamp: string | null
  }
  verifyIdentity: {
    completed: boolean
    timeStamp: string | null
  }
  signAgreements: {
    [poolId: string]: {
      [trancheId: string]: {
        transactionInfo: {
          extrinsicHash: string | null
          blockNumber: string | null
        }
        signedDocument: boolean
      }
    }
  }
}

export interface EntityOnboardingSteps extends IndividualUserSteps {
  verifyBusiness: {
    completed: boolean
    timeStamp: string | null
  }
  verifyEmail: {
    completed: boolean
    timeStamp: string | null
  }
  confirmOwners: {
    completed: boolean
    timeStamp: string | null
  }
}

export type EntityUser = {
  investorType: 'entity'
  walletAddress: string
  businessName: string
  email: string | null
  incorporationDate: string
  jurisdictionCode: string
  registrationNumber: number
  ultimateBeneficialOwners: UltimateBeneficialOwner[]
  steps: EntityOnboardingSteps
  name: string | null
  dateOfBirth: string | null
  countryOfCitizenship: string | null
  onboardingStatus: {
    [poolId: string]: {
      [trancheId: string]: {
        status: 'pending' | 'approved' | 'rejected' | null
        timeStamp: string | null
      }
    }
  }
}

type IndividualUser = {
  investorType: 'individual'
  walletAddress: string
  name: string | null
  dateOfBirth: string | null
  countryOfCitizenship: string | null
  steps: IndividualUserSteps
  onboardingStatus: {
    [poolId: string]: {
      [trancheId: string]: {
        status: 'pending' | 'approved' | 'rejected' | null
        timeStamp: string | null
      }
    }
  }
}

export type OnboardingUser = IndividualUser | EntityUser
