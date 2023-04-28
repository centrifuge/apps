export type PoolStatus = 'open' | 'upcoming' | 'hidden'
export type PoolCountry = 'us' | 'non-us'
export type NonSolicitationNotice = 'all' | 'non-us' | 'none'

export type LoanTemplateAttribute = {
  label: string
  type: {
    primitive: 'string' | 'number'
    statistics?: 'categorical' | 'continuous' | 'ordinal' | 'discrete'
    constructor: 'String' | 'Date' | 'Number' | 'File'
  }
  input: (
    | {
        type: 'text' | 'textarea'
        maxLength?: number
      }
    | {
        type: 'single-select'
        options: string[] | { value: string; label: string }[]
      }
    | {
        type: 'date' | 'time' | 'datetime-local' | 'month' | 'week'
        min?: string
        max?: string
      }
    | {
        type: 'currency'
        symbol: string
        min?: number
        max?: number
        decimals?: number // when defined, number will be stored as an integer with its value multiplied by 10 ^ decimals
      }
    | {
        type: 'number'
        min?: number
        max?: number
        unit?: string
        decimals?: number // when defined, number will be stored as an integer with its value multiplied by 10 ^ decimals
      }
    | {
        type: 'encrypted-file'
        accepted: string
      }
  ) & { placeholder?: string }
  output: {} | null
  public: boolean
}

export type LoanTemplateSection = {
  name: string
  attributes: string[]
}

export type LoanTemplate = {
  name?: string
  options: {
    assetClasses?: string[]
    description: boolean
    image: boolean
  }
  attributes: Record<string, LoanTemplateAttribute>
  sections: LoanTemplateSection[]
}

export type InvestorTypes = 'individual' | 'entity'

export type UltimateBeneficialOwner = {
  name: string
  dateOfBirth: string
  countryOfCitizenship: string
  countryOfResidency: string
}

type PoolOnboardingSteps = {
  [poolId: string]: {
    [trancheId: string]: {
      signAgreement: {
        completed: boolean
        timeStamp: string | null
        transactionInfo: {
          txHash: string | null
          blockNumber: string | null
        }
      }
      status: {
        status: 'pending' | 'approved' | 'rejected' | null
        timeStamp: string | null
      }
    }
  }
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
  verifyEmail: {
    completed: boolean
    timeStamp: string | null
  }
}

export interface EntityOnboardingSteps extends IndividualUserSteps {
  verifyBusiness: {
    completed: boolean
    timeStamp: string
  }
  confirmOwners: {
    completed: boolean
    timeStamp: string | null
  }
}

export type EntityUser = {
  address: string | null
  investorType: 'entity'
  walletAddress: string
  businessName: string
  email: string
  jurisdictionCode: string
  registrationNumber: string
  ultimateBeneficialOwners: UltimateBeneficialOwner[]
  name: string | null
  dateOfBirth: string | null
  countryOfCitizenship: string | null
  countryOfResidency: string | null
  globalSteps: EntityOnboardingSteps
  poolSteps: PoolOnboardingSteps
}

type IndividualUser = {
  address: string | null
  investorType: 'individual'
  walletAddress: string
  name: string
  email: string
  dateOfBirth: string
  countryOfCitizenship: string
  countryOfResidency: string
  globalSteps: IndividualUserSteps
  poolSteps: PoolOnboardingSteps
}

export type OnboardingUser = IndividualUser | EntityUser
