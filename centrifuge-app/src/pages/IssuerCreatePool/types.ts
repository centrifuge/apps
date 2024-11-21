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

export const createPoolFee = () => ({
  name: '',
  category: '',
  feePosition: '',
  feeType: '',
  percentOfNav: '',
  walletAddress: '',
})

export type CreatePoolValues = Omit<
  PoolMetadataInput,
  'poolIcon' | 'issuerLogo' | 'executiveSummary' | 'adminMultisig' | 'poolFees' | 'poolReport' | 'poolRatings'
> & {
  // pool structure
  assetDenomination: string
  trancheStructure: 1 | 2 | 3

  // pool details
  poolType: 'open' | 'closed'
  issuerCategories: { type: string; value: string }[]

  reportAuthorName: string
  reportAuthorTitle: string
  reportAuthorAvatar: File | null
  reportUrl: string
  adminMultisigEnabled: boolean
  adminMultisig: Exclude<PoolMetadataInput['adminMultisig'], undefined>
  poolFees: {
    id?: number
    name: string
    feeType: FeeTypes
    percentOfNav: number | ''
    walletAddress: string
    feePosition: 'Top of waterfall'
    category: string
  }[]
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
  trancheStructure: 1,
  assetClass: 'Private credit',
  assetDenomination: '',
  subAssetClass: '',

  // pool structure -> tranches
  tranches: [createEmptyTranche('')],

  // pool details section
  poolName: '',
  poolIcon: null,
  currency: isTestEnv ? 'USDC' : 'Native USDC',
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

  adminMultisig: {
    signers: [],
    threshold: 1,
  },
  adminMultisigEnabled: false,
  poolFees: [createPoolFee()],
  poolType: 'open',
}
