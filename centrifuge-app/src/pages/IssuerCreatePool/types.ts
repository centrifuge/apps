import { FeeTypes, PoolMetadataInput } from '@centrifuge/centrifuge-js'

export interface Tranche {
  tokenName: string
  symbolName: string
  minRiskBuffer: number | ''
  minInvestment: number | ''
  apy: string
  interestRate: number | ''
  apyPercentage: number | null
}

export interface PoolFee {
  id: number
  name: string
  feeType: FeeTypes
  percentOfNav: number
  walletAddress: string
  feePosition: 'Top of waterfall'
  category: string
}
export interface WriteOffGroupInput {
  days: number | ''
  writeOff: number | ''
  penaltyInterest: number | ''
}

export const createEmptyTranche = (trancheName: string): Tranche => ({
  tokenName: trancheName,
  symbolName: '',
  interestRate: 0,
  minRiskBuffer: trancheName === 'Junior' ? '' : 0,
  minInvestment: 1000,
  apy: 'target',
  apyPercentage: null,
})

export const createPoolFee = (): PoolFee => {
  return {
    id: 0,
    name: '',
    category: '',
    feePosition: 'Top of waterfall',
    feeType: 'Fixed' as FeeTypes,
    percentOfNav: 0.4,
    walletAddress: import.meta.env.REACT_APP_TREASURY,
  }
}

export type CreatePoolValues = Omit<
  PoolMetadataInput,
  | 'poolIcon'
  | 'issuerLogo'
  | 'executiveSummary'
  | 'adminMultisig'
  | 'poolFees'
  | 'poolReport'
  | 'poolRatings'
  | 'issuerName'
  | 'epochHours'
  | 'epochMinutes'
  | 'poolFees'
> & {
  // pool structure
  issuerName: null | ''
  assetDenomination: string

  // pool details
  issuerCategories: { type: string; value: string }[]
  poolIcon: File | null
  issuerLogo: File | null
  executiveSummary: File | null

  reportAuthorName: string
  reportAuthorTitle: string
  reportAuthorAvatar: File | null
  reportUrl: string
  adminMultisigEnabled: boolean
  adminMultisig: Exclude<PoolMetadataInput['adminMultisig'], undefined>
  poolFees: PoolFee[]
  poolRatings: {
    agency?: string
    value?: string
    reportUrl?: string
    reportFile?: File | null
  }[]
}
