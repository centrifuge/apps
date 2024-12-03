import { FeeTypes, PoolMetadataInput } from '@centrifuge/centrifuge-js'
import { isTestEnv } from '../../config'

export interface Tranche {
  tokenName: string
  symbolName: string
  minRiskBuffer: number | ''
  minInvestment: number | ''
  apy: string
  interestRate: number | ''
}

export interface PoolFee {
  id: number
  name: string
  feeType: FeeTypes
  percentOfNav: string
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
  apy: '90d',
})

export const createPoolFee = (): PoolFee => ({
  id: 0,
  name: '',
  category: '',
  feePosition: 'Top of waterfall',
  feeType: '' as FeeTypes,
  percentOfNav: '',
  walletAddress: '',
})

export type CreatePoolValues = Omit<
  PoolMetadataInput,
  'poolIcon' | 'issuerLogo' | 'executiveSummary' | 'adminMultisig' | 'poolFees' | 'poolReport' | 'poolRatings'
> & {
  // pool structure
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

export const initialValues: CreatePoolValues = {
  // pool structure
  poolStructure: 'revolving',
  assetClass: 'Private credit',
  assetDenomination: isTestEnv ? 'USDC' : 'Native USDC',
  subAssetClass: '',
  tranches: [createEmptyTranche('Junior')],

  // pool details section
  poolName: '',
  poolIcon: null,
  maxReserve: 1000000,
  investorType: '',
  issuerName: '',
  issuerRepName: '',
  issuerLogo: null,
  issuerDescription: '',
  issuerShortDescription: '',
  issuerCategories: [{ type: '', value: '' }],
  poolRatings: [{ agency: '', value: '', reportUrl: '', reportFile: null }],
  executiveSummary: null,
  website: '',
  forum: '',
  email: '',
  details: [],
  reportAuthorName: '',
  reportAuthorTitle: '',
  reportAuthorAvatar: null,
  reportUrl: '',

  assetOriginators: [''],
  adminMultisig: {
    signers: [''],
    threshold: 1,
  },
  adminMultisigEnabled: false,
  poolFees: [createPoolFee()],
  poolType: 'open',

  onboarding: {
    tranches: {},
    taxInfoRequired: false,
  },
  onboardingExperience: 'none',
  epochHours: 0,
  epochMinutes: 0,
}
