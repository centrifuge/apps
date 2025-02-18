import { ApiRx } from '@polkadot/api'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { StorageKey, u32 } from '@polkadot/types'
import { Codec } from '@polkadot/types-codec/types'
import { ISubmittableResult } from '@polkadot/types/types'
import { blake2AsHex } from '@polkadot/util-crypto/blake2'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import { isAddress as isEvmAddress } from 'ethers'
import { EMPTY, Observable, combineLatest, expand, firstValueFrom, forkJoin, from, of, startWith } from 'rxjs'
import { combineLatestWith, filter, map, repeatWhen, switchMap, take, takeLast } from 'rxjs/operators'
import { SolverResult, calculateOptimalSolution } from '..'
import { Centrifuge } from '../Centrifuge'
import { Account, TransactionOptions } from '../types'
import {
  AssetTransactionType,
  AssetType,
  InvestorTransactionType,
  PoolFeeTransactionType,
  SubqueryAssetSnapshot,
  SubqueryAssetTransaction,
  SubqueryCurrencyBalances,
  SubqueryInvestorTransaction,
  SubqueryOracleTransaction,
  SubqueryPoolAssetSnapshot,
  SubqueryPoolFeeSnapshot,
  SubqueryPoolFeeTransaction,
  SubqueryPoolOrdersById,
  SubqueryPoolSnapshot,
  SubqueryTrancheBalances,
  SubqueryTrancheSnapshot,
} from '../types/subquery'
import {
  addressToHex,
  computeTrancheId,
  getDateMonthsFromNow,
  getDateYearsFromNow,
  getRandomUint,
  isSameAddress,
  isValidDate,
} from '../utils'
import { CurrencyBalance, Perquintill, Price, Rate, TokenBalance } from '../utils/BN'
import { Dec } from '../utils/Decimal'

const PerquintillBN = new BN(10).pow(new BN(18))
const PriceBN = new BN(10).pow(new BN(18))
const MaxU128 = '340282366920938463463374607431768211455'
const SEC_PER_DAY = 24 * 60 * 60

type AdminRole =
  | 'PoolAdmin'
  | 'Borrower'
  | 'PricingAdmin'
  | 'LiquidityAdmin'
  | 'InvestorAdmin'
  | 'LoanAdmin'
  | 'PODReadAccess'

type CurrencyRole = 'PermissionedAssetManager' | 'PermissionedAssetIssuer'

export type PoolRoleInput =
  | AdminRole
  | {
      TrancheInvestor: [
        trancheId: string,
        permissionedTill: number,
        evmDomains?: [chainId: number, domainAddress: string][]
      ]
    }

export type CurrencyKey = string | { ForeignAsset: string } | { Tranche: [string, string] } | { LocalAsset: string }

export type CurrencyMetadata = {
  key: CurrencyKey
  decimals: number
  name: string
  symbol: string
  isPoolCurrency: boolean
  isPermissioned: boolean
  additional?: any
  location?: any
  displayName: string
}

const AdminRoleBits = {
  PoolAdmin: 0b00000001,
  Borrower: 0b00000010,
  PricingAdmin: 0b00000100,
  LiquidityAdmin: 0b00001000,
  InvestorAdmin: 0b00010000,
  LoanAdmin: 0b00100000,
  PODReadAccess: 0b01000000,
}

// const CurrencyRoleBits = {
//   PermissionedAssetManager: 0b00000001,
//   PermissionedAssetIssuer: 0b00000010,
// }

export type PoolRoles = {
  roles: AdminRole[]
  tranches: { [key: string]: string } // trancheId -> permissionedTill
}

export type LoanInfoInput =
  | {
      valuationMethod: 'outstandingDebt'
      maxBorrowAmount: 'upToTotalBorrowed' | 'upToOutstandingDebt'
      value: BN
      maturityDate: Date | null
      maturityExtensionDays: number | null
      advanceRate: BN
      interestRate: BN
    }
  | {
      valuationMethod: 'cash'
      maxBorrowAmount: 'upToOutstandingDebt'
      value: BN
      maturityDate: Date | null
      advanceRate: BN
      interestRate: BN
    }
  | {
      valuationMethod: 'oracle'
      maxBorrowAmount: BN | null
      maxPriceVariation: BN
      priceId: { isin: string } | { poolLoanId: [string, string] }
      maturityDate: Date | null
      interestRate: BN
      notional: BN
      withLinearPricing: boolean
    }
  | {
      valuationMethod: 'discountedCashFlow'
      probabilityOfDefault: BN
      lossGivenDefault: BN
      discountRate: BN
      maxBorrowAmount: 'upToTotalBorrowed' | 'upToOutstandingDebt'
      value: BN
      maturityDate: Date | null
      maturityExtensionDays: number | null
      advanceRate: BN
      interestRate: BN
    }

export type LoanInfoData = {
  /// Specify the repayments schedule of the loan
  schedule: {
    maturity: { fixed: { date: number; extension: number } } | { none: null }
    interestPayments: 'OnceAtMaturity'
    payDownSchedule: 'None'
  }

  /// Collateral used for this loan
  collateral: [string, string]

  /// Interest rate per second with any penalty applied
  interestRate: { fixed: { ratePerYear: string; compounding: 'Secondly' } }

  pricing:
    | {
        external: {
          priceId: { isin: string } | { poolLoanId: [string, string] }
          maxBorrowAmount: { noLimit: null } | { quantity: string }
          notional: string
          maxPriceVariation: string
          withLinearPricing: boolean
        }
      }
    | {
        internal: {
          /// Valuation method of this loan
          valuationMethod:
            | { outstandingDebt: null }
            | { cash: null }
            | {
                discountedCashFlow: {
                  probabilityOfDefault: string
                  lossGivenDefault: string
                  discountRate: { fixed: { ratePerYear: string; compounding: 'Secondly' } }
                }
              }
          /// Value of the collateral used for this loan
          collateralValue: string
          maxBorrowAmount:
            | { upToTotalBorrowed: { advanceRate: string } }
            | { upToOutstandingDebt: { advanceRate: string } }
        }
      }

  /// Restrictions of this loan
  restrictions: {
    borrows: 'NotWrittenOff' | 'FullOnce'
    repayments: 'None' | 'Full'
  }
}

export type ActiveLoanInfoData = {
  /// Specify the repayments schedule of the loan
  schedule: {
    maturity: { fixed: { date: number; extension: number } } | { none: null }
    interestPayments: 'OnceAtMaturity'
    payDownSchedule: 'None'
  }

  /// Collateral used for this loan
  collateral: [string, string]

  pricing:
    | {
        external: {
          info: {
            priceId: { isin: string } | { poolLoanId: [string, string] }
            maxBorrowAmount: { noLimit: null } | { quantity: string }
            notional: string
            maxPriceVariation: string
            withLinearPricing: boolean
          }
          outstandingQuantity: string
          interest: {
            interestRate: { fixed: { ratePerYear: string; compounding: 'Secondly' } }
            normalizedAcc: string
            penalty: string
          }
        }
      }
    | {
        internal: {
          info: {
            /// Valuation method of this loan
            valuationMethod:
              | { outstandingDebt: null }
              | { cash: null }
              | {
                  discountedCashFlow: {
                    probabilityOfDefault: string
                    lossGivenDefault: string
                    discountRate: { fixed: { ratePerYear: string; compounding: 'Secondly' } }
                  }
                }
            /// Value of the collateral used for this loan
            collateralValue: string
            maxBorrowAmount:
              | { upToTotalBorrowed: { advanceRate: string } }
              | { upToOutstandingDebt: { advanceRate: string } }
          }
          interest: {
            interestRate: { fixed: { ratePerYear: string; compounding: 'Secondly' } }
            normalizedAcc: string
            penalty: string
          }
        }
      }

  /// Restrictions of this loan
  restrictions: {
    borrows: 'NotWrittenOff' | 'FullOnce'
    repayments: 'None' | 'Full'
  }
}

type TrancheDetailsData = {
  trancheType:
    | { residual: null }
    | {
        nonResidual: {
          interestRatePerSec: string
          minRiskBuffer: string
        }
      }
  seniority: number
  debt: string
  reserve: string
  ratio: string
  loss: string
  lastUpdatedInterest: number
}

type PoolDetailsData = {
  currency: CurrencyKey
  tranches: { tranches: TrancheDetailsData[]; ids: string[] }
  metadata?: string
  parameters: {
    minEpochTime: number
    maxNavAge: number
  }
  epoch: {
    current: number
    lastClosed: number
    lastExecuted: number
  }
  reserve: {
    max: string
    total: string
    available: string
  }
}

type NAVDetailsData = {
  value: string
  lastUpdated: number
}

type EpochExecutionData = {
  epoch: number
  nav: string
  reserve: string
  maxReserve: string
  challengePeriodEnd: number
  // incomplete
}

export type Tranche = {
  index: number
  id: string
  seniority: number
  balance: TokenBalance
  minRiskBuffer: Perquintill | null
  currentRiskBuffer: Perquintill
  interestRatePerSec: Rate | null
  yield30DaysAnnualized: Perquintill | null
  yield90DaysAnnualized: Perquintill | null
  yieldYTD: Perquintill | null
  yieldSinceInception: Perquintill | null
  lastUpdatedInterest: string
  ratio: Perquintill
}

export type TrancheWithTokenPrice = Tranche & {
  totalIssuance: TokenBalance
  tokenPrice: null | Price
  capacity: CurrencyBalance
}

export type Token = TrancheWithTokenPrice & {
  poolId: string
  poolMetadata: string | undefined
  poolCurrency: CurrencyMetadata
  currency: CurrencyMetadata
}

export type Pool = {
  id: string
  currency: CurrencyMetadata
  metadata?: string
  value: CurrencyBalance
  createdAt: string | null
  tranches: Token[]
  reserve: {
    max: CurrencyBalance
    available: CurrencyBalance
    total: CurrencyBalance
  }
  epoch: {
    current: number
    lastClosed: string
    lastExecuted: number
    challengePeriodEnd: number
    status: 'submissionPeriod' | 'challengePeriod' | 'executionPeriod' | 'ongoing'
  }
  nav: {
    lastUpdated: string
    fees: CurrencyBalance
    total: CurrencyBalance
    aum: CurrencyBalance
  }
  fees: {
    totalPaid: CurrencyBalance
    totalPending: CurrencyBalance
  }
  parameters: {
    minEpochTime: number
    challengeTime: number
    maxNavAge: number
  }
}

export enum LoanStatus {
  // this when asset is locked and loan nft is issued.
  Created = 'Created',
  // this is when loan is in active state. Either underwriters or oracles can move loan to this state
  // by providing information like discount rates etc.. to loan
  Active = 'Active',
  // loan is closed and asset nft is transferred back to borrower and loan nft is transferred back to loan module
  Closed = 'Closed',
}

// type LoanStatus = 'Created' | 'Active' | 'Closed'

// type from chain
type CreatedLoanData = {
  borrower: string
  info: LoanInfoData
}

// type from chain
type ActiveLoanData = ActiveLoanInfoData & {
  borrower: string
  writeOffPercentage: string
  originationDate: number
  totalBorrowed: string
  totalRepaid: {
    interest: string
    principal: string
    unscheduled: string
  }
  normalizedDebt: string
}

// type from chain
type ClosedLoanData = {
  info: LoanInfoData
  closedAt: number
  totalBorrowed: string
  totalRepaid: {
    interest: string
    principal: string
    unscheduled: string
  }
}

export type PricingInfo = InternalPricingInfo | ExternalPricingInfo

export type InternalPricingInfo = {
  valuationMethod: 'discountedCashFlow' | 'outstandingDebt' | 'cash'
  maxBorrowAmount: 'upToTotalBorrowed' | 'upToOutstandingDebt'
  value: CurrencyBalance
  maturityDate: string | null
  maturityExtensionDays: number | null
  advanceRate: Rate
  interestRate: Rate
  probabilityOfDefault?: Rate
  lossGivenDefault?: Rate
  discountRate?: Rate
}

export type ExternalPricingInfo = {
  valuationMethod: 'oracle'
  maxBorrowAmount: CurrencyBalance | null
  maxPriceVariation: Rate
  outstandingQuantity: CurrencyBalance
  priceId: { isin: string } | { poolLoanId: [string, string] }
  maturityDate: string | null
  maturityExtensionDays: number | null
  oracle: {
    value: CurrencyBalance
    timestamp: number
    account: string
  }[]
  notional: CurrencyBalance
  interestRate: Rate
  withLinearPricing: boolean
}

type TinlakePricingInfo = {
  maturityDate: string
  interestRate: Rate
  ceiling: CurrencyBalance
}

export type TinlakeLoan = {
  asset: {
    collectionId: string
    nftId: string
  }
  dateClosed: number
  id: string
  outstandingDebt: CurrencyBalance
  owner: string
  poolId: string
  pricing: TinlakePricingInfo
  riskGroup: string
  status: 'Created' | 'Active' | 'Closed'
  totalBorrowed: CurrencyBalance
  totalRepaid: CurrencyBalance
  originationDate: string
  writeOffPercentage: Rate
}

// transformed type for UI
export type CreatedLoan = {
  status: 'Created'
  fetchedAt: Date
  id: string
  poolId: string
  pricing: PricingInfo
  borrower: string
  asset: {
    collectionId: string
    nftId: string
  }
  totalBorrowed: CurrencyBalance
  totalRepaid: CurrencyBalance
  normalizedDebt: CurrencyBalance
  outstandingDebt: CurrencyBalance
}

// transformed type for UI
export type ActiveLoan = {
  status: 'Active'
  fetchedAt: Date
  id: string
  poolId: string
  pricing: PricingInfo
  borrower: string
  asset: {
    collectionId: string
    nftId: string
  }
  writeOffStatus?: {
    percentage: Rate
    penaltyInterestRate: Rate
  }
  totalBorrowed: CurrencyBalance
  totalRepaid: CurrencyBalance
  repaid: {
    interest: CurrencyBalance
    principal: CurrencyBalance
    unscheduled: CurrencyBalance
  }
  originationDate: string
  normalizedDebt: CurrencyBalance
  outstandingDebt: CurrencyBalance
  outstandingPrincipal: CurrencyBalance
  outstandingInterest: CurrencyBalance
  presentValue: CurrencyBalance
  currentPrice: CurrencyBalance // may not actually be set yet, this is what the price should be
}

// transformed type for UI
export type ClosedLoan = {
  status: 'Closed'
  fetchedAt: Date
  id: string
  poolId: string
  pricing: PricingInfo
  asset: {
    collectionId: string
    nftId: string
  }
  totalBorrowed: CurrencyBalance
  totalRepaid: CurrencyBalance
  repaid: {
    interest: CurrencyBalance
    principal: CurrencyBalance
    unscheduled: CurrencyBalance
  }
}

export type Loan = CreatedLoan | ClosedLoan | ActiveLoan

export type AccountCurrencyBalance = {
  balance: CurrencyBalance
  currency: CurrencyMetadata
}

export type AccountTokenBalance = {
  balance: TokenBalance
  currency: CurrencyMetadata
  poolId: string
  trancheId: string
}

export type AccountNativeLock = { id: string; amount: CurrencyBalance; reasons: string }

export type TrancheInput = {
  interestRatePerSec?: BN
  minRiskBuffer?: BN
  tokenName?: string
  tokenSymbol?: string
}

export type DailyTrancheState = {
  id: string
  price: null | Price
  tokenSupply: TokenBalance
  fulfilledInvestOrders: CurrencyBalance
  fulfilledRedeemOrders: CurrencyBalance
  outstandingInvestOrders: CurrencyBalance
  outstandingRedeemOrders: CurrencyBalance
  yield7DaysAnnualized: Perquintill
  yield30DaysAnnualized: Perquintill
  yield90DaysAnnualized: Perquintill
  yieldSinceInception: Perquintill
  yieldMTD: Perquintill
  yieldQTD: Perquintill
  yieldYTD: Perquintill
  yieldSinceLastPeriod: Perquintill
}

export type DailyPoolFeesState = {
  pendingAmount: CurrencyBalance
  poolFee: { name: string }
  poolFeeId: string
  sumAccruedAmount: CurrencyBalance
  sumChargedAmount: CurrencyBalance
  sumPaidAmount: CurrencyBalance
  sumAccruedAmountByPeriod: CurrencyBalance
  sumChargedAmountByPeriod: CurrencyBalance
  sumPaidAmountByPeriod: CurrencyBalance
  timestamp: string
}

export type DailyPoolState = {
  poolState: {
    netAssetValue: CurrencyBalance
    totalReserve: CurrencyBalance
    offchainCashValue: CurrencyBalance
    portfolioValuation: CurrencyBalance
    sumPoolFeesPendingAmount: CurrencyBalance
    sumBorrowedAmountByPeriod: CurrencyBalance
    sumRepaidAmountByPeriod: CurrencyBalance
    sumPoolFeesChargedAmountByPeriod: CurrencyBalance
    sumPoolFeesAccruedAmountByPeriod: CurrencyBalance
    sumPoolFeesPaidAmountByPeriod: CurrencyBalance
    sumPrincipalRepaidAmountByPeriod: CurrencyBalance
    sumInterestRepaidAmountByPeriod: CurrencyBalance
    sumUnscheduledRepaidAmountByPeriod: CurrencyBalance
    sumInvestedAmountByPeriod: CurrencyBalance
    sumRedeemedAmountByPeriod: CurrencyBalance
    sumDebtWrittenOffByPeriod: CurrencyBalance
    sumInterestAccruedByPeriod: CurrencyBalance
    sumRealizedProfitFifoByPeriod: CurrencyBalance
    sumUnrealizedProfitAtMarketPrice: CurrencyBalance
    sumUnrealizedProfitAtNotional: CurrencyBalance
    sumUnrealizedProfitByPeriod: CurrencyBalance
  }
  poolValue: CurrencyBalance
  timestamp: string
  tranches: { [trancheId: string]: DailyTrancheState }
  sumPoolFeesChargedAmountByPeriod: string | null
  sumPoolFeesAccruedAmountByPeriod: string | null
  sumPoolFeesPaidAmountByPeriod: string | null
  sumBorrowedAmountByPeriod: string
  sumPrincipalRepaidAmountByPeriod: string
  sumInterestRepaidAmountByPeriod: string
  sumUnscheduledRepaidAmountByPeriod: string
  sumRealizedProfitFifoByPeriod: string
  sumUnrealizedProfitAtMarketPrice: string
  sumUnrealizedProfitAtNotional: string
  sumUnrealizedProfitByPeriod: string
  sumRepaidAmountByPeriod: string
  sumInvestedAmountByPeriod: string
  sumRedeemedAmountByPeriod: string
  blockNumber: number
}

export type IssuerDetail = {
  title: string
  body: string
}

export type FileType = { uri: string; mime: string }

export type PoolReport = {
  author: {
    name: string
    title: string
    avatar: FileType | null
  }
  url: string
}
export interface TrancheFormValues {
  tokenName: string
  symbolName: string
  interestRate: number | ''
  minRiskBuffer: number | ''
  minInvestment: number | ''
  apy: string | ''
  apyPercentage: number | null
}

export interface PoolMetadataInput {
  // structure
  assetDenomination: string
  poolStructure: 'revolving'
  assetClass: 'Public credit' | 'Private credit'
  subAssetClass: string
  tranches: TrancheFormValues[]

  // details
  poolName: string
  investorType: string
  poolIcon: FileType
  poolType: 'open' | 'closed'
  maxReserve: number | ''
  issuerName: string
  issuerRepName: string
  issuerLogo: FileType
  issuerShortDescription: string
  issuerDescription: string
  website: string
  forum: string
  email: string
  executiveSummary: FileType | null
  details?: IssuerDetail[]
  issuerCategories: { type: string; value: string; description?: string }[]
  poolRatings: {
    agency?: string
    value?: string
    reportUrl?: string
    reportFile?: FileType | null
  }[]
  report: {
    author: {
      name: string
      title: string
      avatar: FileType | null
    }
    url: string
  }

  // setup
  adminMultisig?: {
    signers: string[]
    threshold: number
  }
  poolFees: { id: number; name: string; feePosition: 'Top of waterfall'; category?: string; feeType: FeeTypes }[]
  adminMultisigEnabled: boolean
  assetOriginators: string[]
  onboardingExperience: string
  onboarding?: {
    tranches: { [trancheId: string]: { agreement: FileType | undefined; openForOnboarding: boolean } }
    taxInfoRequired?: boolean
    externalOnboardingUrl?: string
  }

  listed?: boolean
  epochHours: number | ''
  epochMinutes: number | ''
}

export type WithdrawAddress = {
  name?: string
  address: string
  location: 'centrifuge' | { parachain: number } | { evm: number }
}
export type PoolStatus = 'open' | 'upcoming' | 'hidden'
export type PoolCountry = 'us' | 'non-us'
export type NonSolicitationNotice = 'all' | 'non-us' | 'none'
export type PoolMetadata = {
  version?: number
  pool: {
    name: string
    icon: FileType | null
    asset: {
      class: 'Public credit' | 'Private credit'
      subClass: string
    }
    investorType: string
    poolStructure: string
    poolFees?: {
      id: number
      name: string
      feePosition: 'Top of waterfall'
      category?: string
    }[]
    newInvestmentsStatus?: Record<string, 'closed' | 'request' | 'open'>
    issuer: {
      repName: string
      name: string
      description: string
      email?: string
      logo?: FileType | null
      shortDescription: string
      categories: { type: string; value: string; customType?: string }[]
    }
    links: {
      executiveSummary: FileType | null
      forum?: string
      website?: string
    }
    details?: IssuerDetail[]
    status: PoolStatus
    listed: boolean
    report?: PoolReport
    poolRatings?: {
      agency?: string
      value?: string
      reportUrl?: string
      reportFile?: FileType | null
    }[]
  }
  pod?: {
    indexer?: string | null
  }
  tranches: Record<
    string,
    {
      icon?: FileType | null
      minInitialInvestment?: string
      apy: string
      apyPercentage: number | null
    }
  >
  loanTemplates?: {
    id: string
    createdAt: string
  }[]
  adminMultisig?: {
    signers: string[]
    threshold: number
  }
  onboarding?: {
    kybRestrictedCountries?: string[]
    kycRestrictedCountries?: string[]
    externalOnboardingUrl?: string
    tranches: { [trancheId: string]: { agreement: FileType | undefined; openForOnboarding: boolean } }
    podReadAccess?: boolean
    taxInfoRequired?: boolean
  }
}

type AssetCurrencyData = {
  decimals: number
  name: string
  symbol: string
  existentialDeposit: string
  location: any
  additional: {
    xcm: {
      feePerSecond: null | string
    }
    mintable: boolean
    permissioned: boolean
    poolCurrency: boolean
  }
}

export type WriteOffGroup = {
  overdueDays: number
  penaltyInterestRate: Rate
  percentage: Rate
}

type InvestorTransaction = {
  id: string
  timestamp: Date
  accountId: string
  trancheId: string
  epochNumber: number
  type: InvestorTransactionType
  currencyAmount?: CurrencyBalance
  tokenAmount?: CurrencyBalance
  tokenPrice?: Price
  transactionFee?: CurrencyBalance
  chainId: number
  evmAddress?: string
  hash: string
}

export type AssetTransaction = {
  id: string
  timestamp: Date
  poolId: string
  accountId: string
  epochId: string
  type: AssetTransactionType
  amount: CurrencyBalance | undefined
  settlementPrice: string | null
  quantity: string | null
  principalAmount: CurrencyBalance | undefined
  interestAmount: CurrencyBalance | undefined
  hash: string
  realizedProfitFifo: CurrencyBalance | undefined
  unrealizedProfitAtMarketPrice: CurrencyBalance | undefined
  asset: {
    id: string
    metadata: string
    type: AssetType
    currentPrice: string | null
  }
  fromAsset?: {
    id: string
    metadata: string
    type: AssetType
  }
  toAsset?: {
    id: string
    metadata: string
    type: AssetType
  }
}

export type AssetSnapshot = {
  actualMaturityDate: string | undefined
  actualOriginationDate: number | undefined
  advanceRate: Decimal | undefined
  assetId: string
  collateralValue: CurrencyBalance | undefined
  currentPrice: CurrencyBalance | undefined
  discountRate: string | undefined
  faceValue: CurrencyBalance | undefined
  lossGivenDefault: string | undefined
  name: string
  outstandingDebt: CurrencyBalance | undefined
  outstandingInterest: CurrencyBalance | undefined
  outstandingPrincipal: CurrencyBalance | undefined
  outstandingQuantity: CurrencyBalance | undefined
  presentValue: CurrencyBalance | undefined
  probabilityOfDefault: string | undefined
  status: string
  sumRealizedProfitFifo: CurrencyBalance | undefined
  timestamp: Date
  totalRepaidInterest: CurrencyBalance | undefined
  totalRepaidPrincipal: CurrencyBalance | undefined
  totalRepaidUnscheduled: CurrencyBalance | undefined
  unrealizedProfitAtMarketPrice: CurrencyBalance | undefined
}

export type AssetPoolSnapshot = {
  timestamp: Date
  assetId: string
  presentValue: CurrencyBalance | undefined
  currentPrice: CurrencyBalance | undefined
  outstandingPrincipal: CurrencyBalance | undefined
  outstandingInterest: CurrencyBalance | undefined
  outstandingDebt: CurrencyBalance | undefined
  outstandingQuantity: CurrencyBalance | undefined
  totalRepaidPrincipal: CurrencyBalance | undefined
  totalRepaidInterest: CurrencyBalance | undefined
  totalRepaidUnscheduled: CurrencyBalance | undefined
}

export type PoolFeeTransaction = {
  id: string
  timestamp: Date
  epochNumber: string
  type: PoolFeeTransactionType
  amount: CurrencyBalance | undefined
  poolFee: {
    feeId: Number
  }
}

export type OracleTransaction = {
  id: string
  timestamp: Date
  key: string
  value: CurrencyBalance | undefined
}

type Holder = {
  accountId: string
  chainId: number
  trancheId: string
  evmAddress?: string
  balance: CurrencyBalance
  pendingInvestCurrency: CurrencyBalance
  claimableTrancheTokens: CurrencyBalance
  sumClaimedTrancheTokens: CurrencyBalance
  pendingRedeemTrancheTokens: CurrencyBalance
  claimableCurrency: CurrencyBalance
  sumClaimedCurrency: CurrencyBalance
}

export type ExternalLoan = Loan & {
  pricing: ExternalPricingInfo
}
export type InternalLoan = Loan & {
  pricing: InternalPricingInfo
}

export type Permissions = {
  pools: {
    [poolId: string]: PoolRoles
  }
  currencies: {
    [currency: string]: {
      roles: CurrencyRole[]
      holder: boolean
    }
  }
}

export type FeeTypes = 'fixed' | 'chargedUpTo'
export type FeeLimits = 'shareOfPortfolioValuation' | 'amountPerSecond'

export type ActivePoolFees = {
  type: FeeTypes
  amounts: {
    percentOfNav: Rate
    pending: CurrencyBalance
  }
  limit: FeeLimits
  destination: string
  editor:
    | {
        root: null
      }
    | { account: string }
  id: number
  position: 'Top'
}

export type ActivePoolFeesData = {
  amounts: {
    disbursement: string
    feeType: {
      [K in FeeTypes]: {
        limit: {
          [L in FeeLimits]: string
        }
      }
    }
    payable: {
      upTo: string
    }
    pending: string
  }
  destination: string
  editor:
    | {
        root: null
      }
    | { account: string }
  id: number
}

export type AddFee = {
  fee: {
    destination: string
    feeType: FeeTypes
    limit: 'ShareOfPortfolioValuation' | 'AmountPerSecond'
    name: string
    amount: Rate
    account?: string
    category?: string
    feePosition: 'Top of waterfall'
  }
  poolId: string
}

export type PoolFeesCreatePool = Array<
  [
    string,
    {
      destination: string
      editor: any
      feeType: {
        [key: string]: {
          limit: {
            ShareOfPortfolioValuation: Rate
          }
        }
      }
    }
  ]
>

export type TrancheCreatePool = {
  trancheType:
    | 'Residual'
    | {
        NonResidual: {
          interestRatePerSec: string
          minRiskBuffer: string
        }
      }
  metadata: {
    tokenName: string
    tokenSymbol: string
  }
}

const formatPoolKey = (keys: StorageKey<[u32]>) => (keys.toHuman() as string[])[0].replace(/\D/g, '')
const formatLoanKey = (keys: StorageKey<[u32, u32]>) => (keys.toHuman() as string[])[1].replace(/\D/g, '')

const MAX_ATTEMPTS = 10

export function getPoolsModule(inst: Centrifuge) {
  function createPool(
    args: [
      admin: string,
      poolId: string,
      tranches: TrancheCreatePool[],
      currency: CurrencyKey,
      maxReserve: BN,
      metadata: PoolMetadataInput,
      fees: PoolFeesCreatePool[]
    ],
    options?: TransactionOptions
  ) {
    const [admin, poolId, tranches, currency, maxReserve, metadata, fees] = args

    return inst.getApi().pipe(
      switchMap((api) =>
        api.query.ormlAssetRegistry.metadata(currency).pipe(
          take(1),
          switchMap((rawCurrencyMeta) => {
            const currencyMeta = rawCurrencyMeta.toPrimitive() as AssetCurrencyData
            return pinPoolMetadata(metadata, poolId, currencyMeta.decimals, options)
          }),
          switchMap((pinnedMetadata) => {
            const tx = api.tx.poolRegistry.register(
              admin,
              poolId,
              tranches,
              currency,
              maxReserve.toString(),
              pinnedMetadata.ipfsHash,
              [],
              fees
            )
            if (options?.createType === 'propose') {
              const proposalTx = api.tx.utility.batchAll([
                api.tx.preimage.notePreimage(tx.method.toHex()),
                api.tx.democracy.propose(
                  { Lookup: [tx.method.hash, tx.method.encodedLength] },
                  api.consts.democracy.minimumDeposit
                ),
              ])
              return inst.wrapSignAndSend(api, proposalTx, options)
            }
            if (options?.createType === 'notePreimage') {
              const preimageTx = api.tx.preimage.notePreimage(tx.method.toHex())
              return inst.wrapSignAndSend(api, preimageTx, options)
            }
            return inst.wrapSignAndSend(api, tx, options)
          })
        )
      )
    )
  }

  function pinPoolMetadata(
    metadata: PoolMetadataInput,
    poolId: string,
    currencyDecimals: number,
    options?: TransactionOptions
  ) {
    if (options?.paymentInfo) {
      const hash = '0'.repeat(46)
      return of({ uri: `ipfs://${hash}`, ipfsHash: hash })
    }

    const tranchesById: PoolMetadata['tranches'] = {}
    metadata.tranches.forEach((tranche, index) => {
      tranchesById[computeTrancheId(index, poolId)] = {
        minInitialInvestment: CurrencyBalance.fromFloat(tranche.minInvestment, currencyDecimals).toString(),
        apy: metadata.tranches[0].apy,
        apyPercentage: tranche.apyPercentage,
      }
    })

    const formattedMetadata: PoolMetadata = {
      version: 1,
      pool: {
        name: metadata.poolName,
        icon: metadata.poolIcon,
        asset: {
          class: metadata.assetClass,
          subClass: metadata.subAssetClass,
        },
        issuer: {
          name: metadata.issuerName,
          repName: metadata.issuerRepName,
          description: metadata.issuerDescription,
          email: metadata.email,
          logo: metadata.issuerLogo,
          shortDescription: metadata.issuerShortDescription,
          categories: metadata.issuerCategories,
        },
        poolStructure: metadata.poolStructure,
        investorType: metadata.investorType,
        links: {
          executiveSummary: metadata.executiveSummary,
          forum: metadata.forum,
          website: metadata.website,
        },
        details: metadata.details,
        status: 'open',
        listed: metadata.listed ?? true,
        poolFees: metadata.poolFees,
        poolRatings: metadata.poolRatings.length > 0 ? metadata.poolRatings : [],
        report: metadata.report
          ? {
              author: {
                name: metadata.report.author.name,
                title: metadata.report.author.title,
                avatar: metadata.report.author.avatar,
              },
              url: metadata.report.url,
            }
          : undefined,
      },
      pod: {},
      tranches: tranchesById,
      adminMultisig: metadata.adminMultisig,
      onboarding: {
        tranches: metadata.onboarding?.tranches || {},
        taxInfoRequired: metadata.onboarding?.taxInfoRequired,
        externalOnboardingUrl: metadata.onboarding?.externalOnboardingUrl,
      },
    }

    return inst.metadata.pinJson(formattedMetadata)
  }

  type UpdatePoolInput = [
    poolId: string,
    updates: {
      minEpochTime?: number
      tranches?: TrancheInput[]
      maxNavAge?: number
    }
  ]

  function updatePool(args: UpdatePoolInput, options?: TransactionOptions) {
    const [poolId, updates] = args
    const { minEpochTime: minEpochTimeInput, tranches: tranchesInput, maxNavAge: maxNavAgeInput } = updates
    const $api = inst.getApi()

    const minEpochTime = minEpochTimeInput ? { newValue: minEpochTimeInput } : undefined
    const tranches = tranchesInput
      ? {
          newValue: tranchesInput.map((t) =>
            t.interestRatePerSec
              ? { trancheType: { NonResidual: [t.interestRatePerSec.toString(), t.minRiskBuffer?.toString()] } }
              : { trancheType: 'Residual', seniority: null }
          ),
        }
      : undefined
    const trancheMetadata = tranchesInput
      ? {
          newValue: tranchesInput,
        }
      : undefined
    const maxNavAge = maxNavAgeInput ? { newValue: maxNavAgeInput } : undefined

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.poolRegistry.update(poolId, {
          minEpochTime,
          tranches,
          maxNavAge,
          trancheMetadata,
        })
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function updatePoolRoles(
    args: [poolId: string, add: [Account, PoolRoleInput][], remove: [Account, PoolRoleInput][]],
    options?: TransactionOptions
  ) {
    const [poolId, add, remove] = args
    const self = inst.getActingAddress()
    // Make sure a removal of the PoolAdmin role of the acting address is the last tx in the batch, otherwise the later txs will fail
    const sortedRemove = [...remove].sort(([addr, role]) =>
      role === 'PoolAdmin' && isSameAddress(addr, self) ? 1 : -1
    )
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.utility.batchAll([
          ...add.flatMap(([addr, role]) => {
            const [trancheId, validTill, evmDomains = []] = typeof role === 'string' ? [] : role.TrancheInvestor
            return [
              api.tx.permissions.add(
                { PoolRole: typeof role === 'string' ? 'PoolAdmin' : 'InvestorAdmin' },
                addr,
                { Pool: poolId },
                { PoolRole: typeof role === 'string' ? role : { TrancheInvestor: role.TrancheInvestor.slice(0, 2) } }
              ),
              ...evmDomains.map((domain) =>
                api.tx.liquidityPools.updateMember(poolId, trancheId, { EVM: domain }, validTill)
              ),
            ]
          }),
          ...sortedRemove.flatMap(([addr, role]) => {
            const [trancheId, validTill, evmDomains = []] = typeof role === 'string' ? [] : role.TrancheInvestor
            return [
              api.tx.permissions.remove(
                { PoolRole: typeof role === 'string' ? 'PoolAdmin' : 'InvestorAdmin' },
                addr,
                { Pool: poolId },
                { PoolRole: role }
              ),
              ...evmDomains.map((domain) =>
                api.tx.liquidityPools.updateMember(poolId, trancheId, { EVM: domain }, validTill)
              ),
            ]
          }),
        ])
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function setMaxReserve(args: [poolId: string, maxReserve: BN], options?: TransactionOptions) {
    const [poolId, maxReserve] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.poolSystem.setMaxReserve(poolId, maxReserve.toString())
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function setMetadata(args: [poolId: string, metadata: PoolMetadata], options?: TransactionOptions) {
    const [poolId, metadata] = args
    const $api = inst.getApi()

    const $pinnedMetadata = inst.metadata.pinJson(metadata)
    return combineLatest([$api, $pinnedMetadata]).pipe(
      switchMap(([api, pinnedMetadata]) => {
        const submittable = api.tx.poolRegistry.setMetadata(poolId, pinnedMetadata.ipfsHash)
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function updateInvestOrder(args: [poolId: string, trancheId: string, newOrder: BN], options?: TransactionOptions) {
    const [poolId, trancheId, newOrder] = args

    const address = inst.getActingAddress()

    return inst.getApi().pipe(
      switchMap(
        (api) => api.query.investments.investOrderId([poolId, trancheId]),
        (api, rawOrderId) => ({ api, rawOrderId })
      ),
      combineLatestWith(getOrder([address, poolId, trancheId])),
      take(1),
      switchMap(([{ api, rawOrderId }, order]) => {
        const orderId = Number(rawOrderId.toHex() as string)
        let submittable
        if ((!order.invest.isZero() || !order.redeem.isZero()) && order.submittedAt !== orderId) {
          submittable = api.tx.utility.batchAll([
            !order.invest.isZero()
              ? api.tx.investments.collectInvestments([poolId, trancheId])
              : api.tx.investments.collectRedemptions([poolId, trancheId]),
            api.tx.investments.updateInvestOrder([poolId, trancheId], newOrder.toString()),
          ])
        } else {
          submittable = api.tx.investments.updateInvestOrder([poolId, trancheId], newOrder.toString())
        }
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function updateRedeemOrder(args: [poolId: string, trancheId: string, newOrder: BN], options?: TransactionOptions) {
    const [poolId, trancheId, newOrder] = args
    const address = inst.getActingAddress()
    const { getAccountStakes } = inst.rewards

    return inst.getApi().pipe(
      switchMap((api) =>
        combineLatest([
          api.query.investments.redeemOrderId([poolId, trancheId]),
          getOrder([address, poolId, trancheId]),
          getAccountStakes([address, poolId, trancheId]),
        ]).pipe(
          map(([rawOrderId, order, accountStakes]) => ({
            api,
            rawOrderId,
            order,
            accountStakes,
          }))
        )
      ),
      take(1),
      switchMap(({ api, rawOrderId, order, accountStakes }) => {
        const orderId = Number(rawOrderId.toHex())
        const { stake } = accountStakes
        const redeemTx = api.tx.investments.updateRedeemOrder([poolId, trancheId], newOrder.toString())
        const batch = [redeemTx]

        if ((!order.invest.isZero() || !order.redeem.isZero()) && order.submittedAt !== orderId) {
          batch.unshift(
            api.tx.investments.collectInvestments([poolId, trancheId]),
            api.tx.investments.collectRedemptions([poolId, trancheId])
          )
        }
        if (!stake.isZero()) {
          const unstakeAmount = newOrder.gte(stake) ? stake : newOrder
          batch.unshift(api.tx.liquidityRewards.unstake({ Tranche: [poolId, trancheId] }, unstakeAmount))
        }

        const tx = batch.length > 1 ? api.tx.utility.batchAll(batch) : redeemTx

        return inst.wrapSignAndSend(api, tx, options)
      })
    )
  }

  function closeEpoch(args: [poolId: string, batchSolution: boolean], options?: TransactionOptions) {
    const [poolId, batchSolution] = args
    const $api = inst.getApi()

    const $solution = batchSolution ? submitSolution([poolId], { dryRun: true }) : of(null)

    return combineLatest([$api, $solution]).pipe(
      switchMap(([api, optimalSolution]) => {
        if (optimalSolution) {
          const trancheSolution = (optimalSolution as SolverResult).tranches.map((tranche) => [
            tranche.invest.perquintill,
            tranche.redeem.perquintill,
          ])
          const submittable = api.tx.utility.batchAll([
            api.tx.loans.updatePortfolioValuation(poolId),
            api.tx.poolSystem.closeEpoch(poolId),
            api.tx.poolSystem.submitSolution(poolId, trancheSolution),
          ])
          return inst.wrapSignAndSend(api, submittable, options)
        }
        const submittable = api.tx.utility.batchAll([
          api.tx.loans.updatePortfolioValuation(poolId),
          api.tx.poolSystem.closeEpoch(poolId),
        ])
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function executeEpoch(args: [poolId: string], options?: TransactionOptions) {
    const [poolId] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.poolSystem.executeEpoch(poolId)
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function submitSolution(args: [poolId: string], options?: TransactionOptions) {
    const [poolId] = args
    const $api = inst.getApi()

    return combineLatest([getPool([poolId]), getPoolOrders([poolId])]).pipe(
      take(options?.dryRun ? Infinity : 1),
      switchMap(([pool, poolOrders]) => {
        const solutionTranches = pool.tranches.map((tranche) => ({
          ratio: tranche.ratio,
          minRiskBuffer: tranche.minRiskBuffer,
        }))
        const poolState = {
          netAssetValue: pool.nav.aum,
          reserve: pool.reserve.total,
          tranches: solutionTranches,
          maxReserve: pool.reserve.max,
          currencyDecimals: pool.currency.decimals,
        }
        const orders = poolOrders.map((order) => ({
          invest: order.outstandingInvest,
          redeem: order.outstandingRedeem,
        }))

        const redeemStartWeight = new BN(10).pow(new BN(solutionTranches.length))
        const weights = solutionTranches.map((_t: any, index: number) => ({
          invest: new BN(10).pow(new BN(solutionTranches.length - index)),
          redeem: redeemStartWeight.mul(new BN(10).pow(new BN(index).addn(1))),
        }))

        const $solution = from(calculateOptimalSolution(poolState, orders, weights))
        return combineLatest([$api, $solution])
      }),
      switchMap(([api, optimalSolution]) => {
        if (!optimalSolution.isFeasible) {
          console.warn('Calculated solution is not feasible')
          return of(null)
        }
        if (options?.dryRun) {
          return of(optimalSolution)
        }
        const solution = optimalSolution.tranches.map((tranche) => [
          tranche.invest.perquintill,
          tranche.redeem.perquintill,
        ])
        const submittable = api.tx.poolSystem.submitSolution(poolId, solution)
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function collect(args: [poolId: string, trancheId?: string], options?: TransactionOptions) {
    const [poolId, trancheId] = args
    const $api = inst.getApi()
    const address = inst.getActingAddress()

    if (trancheId !== undefined) {
      return $api.pipe(
        switchMap((api) => {
          const submittable = api.tx.utility.batchAll([
            api.tx.investments.collectInvestments([poolId, trancheId]),
            api.tx.investments.collectRedemptions([poolId, trancheId]),
          ])
          return inst.wrapSignAndSend(api, submittable, options)
        })
      )
    }

    return $api.pipe(
      combineLatestWith(
        getPool([poolId]).pipe(
          switchMap(
            (pool) => combineLatest(pool.tranches.map((t) => getOrder([address, poolId, t.id]))),
            (pool, orders) => ({
              pool,
              orders,
            })
          )
        )
      ),
      take(1),
      switchMap(([api, { pool }]) => {
        const submittable = api.tx.utility.batchAll(
          pool.tranches
            .flatMap((tranche) => {
              // TODO: Only collect orders that are cleared
              return [
                api.tx.investments.collectInvestments([poolId, tranche.id]),
                api.tx.investments.collectRedemptions([poolId, tranche.id]),
              ]
            })
            .filter(Boolean)
        )

        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function getUserPermissions<T extends Account | Account[]>(
    args: [address: T]
  ): T extends Array<Account> ? Observable<Permissions[]> : Observable<Permissions> {
    const [maybeArray] = args
    const addresses = (Array.isArray(maybeArray) ? (maybeArray as Account[]) : [maybeArray as Account]).map(
      (addr) => addressToHex(addr) as string
    )
    const addressSet = new Set(addresses)
    const $api = inst.getApi()

    const $events = inst.getEvents().pipe(
      filter(({ api, events }) => {
        const event = events.find(
          ({ event }) => api.events.permissions.Added.is(event) || api.events.permissions.Removed.is(event)
        )
        if (!event) return false

        const [accountId] = (event.toHuman() as any).event.data
        return addressSet.has(addressToHex(accountId))
      })
    )

    return $api.pipe(
      switchMap((api) =>
        api.query.permissions.permission.keys().pipe(
          switchMap((keys) => {
            const userKeys = keys
              .map((key) => {
                const [account, scope] = key.toHuman() as any as [string, { Pool: string } | { Currency: any }]
                return [
                  addressToHex(account),
                  'Pool' in scope ? { Pool: scope.Pool.replace(/\D/g, '') } : scope,
                ] as const
              })
              .filter(([account, scope]) => {
                return 'Pool' in scope && addressSet.has(account)
              })
            return api.query.permissions.permission.multi(userKeys).pipe(
              map((permissionsData) => {
                const permissionsByAddressIndex: Permissions[] = []

                function setPoolRoles(user: string, poolId: string, roles: PoolRoles) {
                  const i = addresses.indexOf(user)
                  const obj = permissionsByAddressIndex[i] ?? {
                    pools: {},
                    currencies: {},
                  }
                  obj.pools[poolId] = roles
                  permissionsByAddressIndex[i] = obj
                }
                permissionsData.forEach((value, i) => {
                  const [account, scope] = userKeys[i]
                  if ('Pool' in scope) {
                    const poolId = scope.Pool.replace(/\D/g, '')
                    const permissions = value.toJSON() as any
                    const roles: PoolRoles = {
                      roles: (
                        [
                          'PoolAdmin',
                          'Borrower',
                          'PricingAdmin',
                          'LiquidityAdmin',
                          'InvestorAdmin',
                          'LoanAdmin',
                          'PODReadAccess',
                        ] as const
                      ).filter((role) => AdminRoleBits[role] & permissions.poolAdmin.bits),
                      tranches: {},
                    }
                    permissions.trancheInvestor.info
                      .filter((info: any) => info.permissionedTill * 1000 > Date.now())
                      .forEach((info: any) => {
                        roles.tranches[info.trancheId] = new Date(info.permissionedTill * 1000).toISOString()
                      })

                    setPoolRoles(account, poolId, roles)
                  }
                })
                return Array.isArray(maybeArray)
                  ? permissionsByAddressIndex
                  : permissionsByAddressIndex[0] ?? {
                      pools: {},
                      currencies: {},
                    }
              })
            )
          })
        )
      ),

      repeatWhen(() => $events)
    ) as any
  }

  function getPoolPermissions(args: [poolId: string]) {
    const [poolId] = args

    const $api = inst.getApi()

    const $events = inst.getEvents().pipe(
      filter(({ api, events }) => {
        const event = events.find(
          ({ event }) => api.events.permissions.Added.is(event) || api.events.permissions.Removed.is(event)
        )
        if (!event) return false
        const [, scope] = (event.toHuman() as any).event.data
        return poolId === scope.Pool?.replace(/\D/g, '')
      })
    )

    return $api.pipe(
      switchMap(
        (api) => api.query.permissions.permission.keys(),
        (api, keys) => ({ api, keys })
      ),
      switchMap(({ keys, api }) => {
        const poolKeys = keys
          .map((key) => {
            const [account, scope] = key.toHuman() as any[]
            return [account, scope.Pool ? { Pool: scope.Pool.replace(/\D/g, '') } : null]
          })
          .filter(([, scope]) => {
            return scope?.Pool === poolId
          })
        return api.query.permissions.permission.multi(poolKeys).pipe(
          map((permissionsData) => {
            const roles: { [account: string]: PoolRoles } = {}
            permissionsData.forEach((value, i) => {
              const account = addressToHex(poolKeys[i][0])
              const permissions = value.toJSON() as any
              roles[account] = {
                roles: (
                  [
                    'PoolAdmin',
                    'Borrower',
                    'PricingAdmin',
                    'LiquidityAdmin',
                    'InvestorAdmin',
                    'LoanAdmin',
                    'PODReadAccess',
                  ] as const
                ).filter((role) => AdminRoleBits[role] & permissions.poolAdmin.bits),
                tranches: {},
              }
              permissions.trancheInvestor.info
                .filter((info: any) => info.permissionedTill * 1000 > Date.now())
                .forEach((info: any) => {
                  roles[account].tranches[info.trancheId] = new Date(info.permissionedTill * 1000).toISOString()
                })
            })
            return roles
          })
        )
      }),
      take(1),
      repeatWhen(() => $events)
    )
  }

  function getNextLoanId(args: [poolId: string]) {
    const [poolId] = args
    const $api = inst.getApi()
    return $api.pipe(
      switchMap((api) => combineLatest([api.query.loans.lastLoanId(poolId)])),
      map((feeId) => parseInt(feeId[0].toHuman() as string, 10) + 1)
    )
  }

  function createLoan(
    args: [poolId: string, collectionId: string, nftId: string, info: LoanInfoInput],
    options?: TransactionOptions
  ) {
    const [poolId, collectionId, nftId, infoInput] = args
    const $api = inst.getApi()

    const info: LoanInfoData = {
      /// Specify the repayments schedule of the loan
      schedule: {
        maturity: infoInput.maturityDate
          ? {
              fixed: {
                date: Math.round(infoInput.maturityDate.getTime() / 1000),
                extension:
                  'maturityExtensionDays' in infoInput ? (infoInput.maturityExtensionDays ?? 0) * SEC_PER_DAY : 0,
              },
            }
          : ('none' as any),
        interestPayments: 'OnceAtMaturity',
        payDownSchedule: 'None',
      },

      /// Collateral used for this loan
      collateral: [collectionId, nftId],

      /// Interest rate per second with any penalty applied
      interestRate: { fixed: { ratePerYear: infoInput.interestRate.toString(), compounding: 'Secondly' } },

      pricing:
        infoInput.valuationMethod === 'oracle'
          ? {
              external: {
                priceId: infoInput.priceId,
                maxBorrowAmount:
                  infoInput.maxBorrowAmount === null
                    ? { noLimit: null }
                    : { quantity: infoInput.maxBorrowAmount.toString() },
                maxPriceVariation: infoInput.maxPriceVariation!.toString(),
                notional: infoInput.notional.toString(),
                withLinearPricing: infoInput.withLinearPricing,
              },
            }
          : {
              internal: {
                valuationMethod:
                  infoInput.valuationMethod === 'discountedCashFlow'
                    ? {
                        discountedCashFlow: {
                          probabilityOfDefault: infoInput.probabilityOfDefault.toString(),
                          lossGivenDefault: infoInput.lossGivenDefault.toString(),
                          discountRate: {
                            fixed: { ratePerYear: infoInput.discountRate.toString(), compounding: 'Secondly' },
                          },
                        },
                      }
                    : infoInput.valuationMethod === 'outstandingDebt'
                    ? { outstandingDebt: null }
                    : { cash: null },
                /// Value of the collateral used for this loan
                collateralValue: infoInput.value.toString(),
                maxBorrowAmount: {
                  [infoInput.maxBorrowAmount]: { advanceRate: infoInput.advanceRate.toString() },
                } as any,
              },
            },
      restrictions: {
        borrows: 'NotWrittenOff',
        repayments: 'None',
      },
    }

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.loans.create(poolId, info)
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function withdraw(
    args: [amount: BN, currency: CurrencyKey, address: string, location: WithdrawAddress['location']],
    options?: TransactionOptions
  ) {
    const [amount, currencyId, address, location] = args

    return inst.getApi().pipe(
      combineLatestWith(getCurrencies()),
      switchMap(([api, currencies]) => {
        const currency = findCurrency(currencies, currencyId)
        if (!currency || (typeof location !== 'string' && 'parachain' in location && !currency.location?.v3)) {
          throw new Error('Currency not found')
        }
        const submittable =
          typeof location === 'string'
            ? api.tx.tokens.transfer(address, currencyId, amount)
            : 'evm' in location
            ? api.tx.liquidityPools.transfer(currencyId, { EVM: [location.evm, address] }, amount)
            : api.tx.xTokens.transferMultiasset(
                {
                  V3: [
                    {
                      Concrete: currency.location.v3,
                    },
                    {
                      Fungible: amount,
                    },
                  ],
                },
                {
                  V3: {
                    parents: 1,
                    interior: {
                      X2: [
                        {
                          Parachain: location.parachain,
                        },
                        isEvmAddress(address)
                          ? {
                              AccountKey20: {
                                network: null,
                                key: address,
                              },
                            }
                          : {
                              AccountId32: {
                                id: addressToHex(address),
                              },
                            },
                      ],
                    },
                  },
                },
                'Unlimited'
              )

        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function financeExternalLoan(
    args: [poolId: string, loanId: string, quantity: Price, price: CurrencyBalance],
    options?: TransactionOptions
  ) {
    const [poolId, loanId, quantity, price] = args

    return inst.getApi().pipe(
      switchMap((api) => {
        const borrowTx = api.tx.loans.borrow(poolId, loanId, {
          external: { quantity: quantity.toString(), settlementPrice: price.toString() },
        })
        return inst.wrapSignAndSend(api, borrowTx, options)
      })
    )
  }

  function financeLoan(args: [poolId: string, loanId: string, amount: BN], options?: TransactionOptions) {
    const [poolId, loanId, amountBN] = args
    const amount = amountBN.toString()
    return inst.getApi().pipe(
      switchMap((api) => {
        const borrowTx = api.tx.loans.borrow(poolId, loanId, { internal: amount })
        return inst.wrapSignAndSend(api, borrowTx, options)
      })
    )
  }

  function repayLoanPartially(
    args: [poolId: string, loanId: string, principal: BN, interest: BN, unscheduled: BN],
    options?: TransactionOptions
  ) {
    const [poolId, loanId, principal, interest, unscheduled] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.loans.repay(poolId, loanId, {
          principal: { internal: principal.toString() },
          interest: interest.toString(),
          unscheduled: unscheduled.toString(),
        })
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function repayExternalLoanPartially(
    args: [poolId: string, loanId: string, quantity: BN, interest: BN, unscheduled: BN, price: BN],
    options?: TransactionOptions
  ) {
    const [poolId, loanId, quantity, interest, unscheduled, price] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const repaySubmittable = api.tx.loans.repay(poolId, loanId, {
          principal: { external: { quantity: quantity.toString(), settlementPrice: price.toString() } },
          interest: interest.toString(),
          unscheduled: unscheduled.toString(),
        })
        return inst.wrapSignAndSend(api, repaySubmittable, options)
      })
    )
  }

  function repayAndCloseLoan(args: [poolId: string, loanId: string, principal: BN], options?: TransactionOptions) {
    const [poolId, loanId, principal] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.utility.batchAll([
          api.tx.loans.repay(poolId, loanId, {
            principal: { internal: principal.toString() },
            interest: MaxU128,
            unchecked: '0',
          }),
          api.tx.loans.close(poolId, loanId),
        ])
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function transferLoanDebt(
    args: [
      poolId: string,
      fromLoanId: string,
      toLoanId: string,
      repay:
        | { principal: BN; interest: BN; unscheduled: BN }
        | { quantity: BN; price: BN; interest: BN; unscheduled: BN },
      borrow: { quantity: BN; price: BN } | { amount: BN }
    ],
    options?: TransactionOptions
  ) {
    const [poolId, fromLoanId, toLoanId, repay, borrow] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const changeArgs = [
          fromLoanId,
          toLoanId,
          {
            principal:
              'quantity' in repay
                ? { external: { quantity: repay.quantity.toString(), settlementPrice: repay.price.toString() } }
                : { internal: repay.principal.toString() },
            interest: repay.interest.toString(),
            unscheduled: repay.unscheduled.toString(),
          },
          'amount' in borrow
            ? { internal: borrow.amount.toString() }
            : {
                external: { quantity: borrow.quantity.toString(), settlementPrice: borrow.price.toString() },
              },
        ]
        const change = api.createType('RuntimeCommonChangesRuntimeChange', {
          Loans: { TransferDebt: changeArgs },
        })

        const tx = api.tx.utility.batchAll([
          api.tx.loans.proposeTransferDebt(poolId, ...changeArgs),
          api.tx.loans.applyTransferDebt(poolId, blake2AsHex(change.toU8a(), 256)),
        ])
        return inst.wrapSignAndSend(api, tx, options)
      })
    )
  }

  function closeLoan(args: [poolId: string, loanId: string], options?: TransactionOptions) {
    const [poolId, loanId] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.loans.close(poolId, loanId)
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function getPools() {
    const $api = inst.getApi()
    const $events = inst.getEvents().pipe(
      filter(({ api, events }) => {
        const event = events.find(
          ({ event }) =>
            api.events.poolRegistry.Registered.is(event) ||
            api.events.poolRegistry.MetadataSet.is(event) ||
            api.events.poolSystem.Updated.is(event) ||
            api.events.poolSystem.MaxReserveSet.is(event) ||
            api.events.poolSystem.EpochClosed.is(event) ||
            api.events.poolSystem.EpochExecuted.is(event) ||
            api.events.poolSystem.SolutionSubmitted.is(event) ||
            api.events.investments.InvestOrderUpdated.is(event) ||
            api.events.investments.RedeemOrderUpdated.is(event) ||
            api.events.loans.Borrowed.is(event) ||
            api.events.loans.Repaid.is(event) ||
            api.events.loans.DebtTransferred.is(event)
        )
        return !!event
      })
    )

    const $query = inst.getSubqueryObservable<{
      pools: {
        nodes: { id: string; createdAt: string; sumPoolFeesPaidAmount: string; sumPoolFeesPendingAmount: string }[]
      }
    }>(
      `query {
          pools {
            nodes {
              id
              createdAt
              sumPoolFeesPaidAmount
              sumPoolFeesPendingAmount
            }
          }
        }`,
      {},
      true
    )

    return $api.pipe(
      switchMap(
        (api) =>
          combineLatest([
            api.query.poolSystem.pool.entries(),
            api.query.poolRegistry.poolMetadata.entries(),
            api.query.loans.portfolioValuation.entries(),
            api.query.poolSystem.epochExecution.entries(),
            getCurrencies(),
          ]),
        (api, [rawPools, rawMetadatas, rawPortfolioValuation, rawEpochExecutions, currencies]) => ({
          api,
          rawPools,
          rawMetadatas,
          rawPortfolioValuation,
          rawEpochExecutions,
          currencies,
        })
      ),
      switchMap(({ api, rawPools, rawMetadatas, rawPortfolioValuation, rawEpochExecutions, currencies }) => {
        if (!rawPools.length) return of([])

        const portfolioValuationMap = rawPortfolioValuation.reduce((acc, [key, navValue]) => {
          const poolId = formatPoolKey(key as StorageKey<[u32]>)
          const nav = navValue.toJSON() as unknown as NAVDetailsData
          acc[poolId] = {
            lastUpdated: nav ? nav.lastUpdated : 0,
          }
          return acc
        }, {} as Record<string, { lastUpdated: number }>)

        const epochExecutionMap = rawEpochExecutions.reduce((acc, [key, navValue]) => {
          const poolId = formatPoolKey(key as StorageKey<[u32]>)
          const epoch = navValue.toJSON() as EpochExecutionData
          acc[poolId] = {
            epoch: epoch.epoch,
            challengePeriodEnd: epoch.challengePeriodEnd,
          }
          return acc
        }, {} as Record<string, Pick<EpochExecutionData, 'challengePeriodEnd' | 'epoch'>>)

        const metadataMap = rawMetadatas.reduce((acc, [key, metadataValue]) => {
          const poolId = formatPoolKey(key as StorageKey<[u32]>)
          const metadata = (metadataValue.toHuman() as { metadata: string }).metadata
          acc[poolId] = metadata
          return acc
        }, {} as Record<string, string>)

        // read pools, poolIds and currencies from observable
        const pools = rawPools.map(([poolKeys, poolValue]) => {
          const data = poolValue.toJSON() as PoolDetailsData
          const { currency } = poolValue.toHuman() as any
          data.currency = parseCurrencyKey(currency)
          return {
            id: formatPoolKey(poolKeys as any), // poolId
            data, // pool data
          }
        })

        const keys = pools
          .map(({ id, data }) => {
            return data.tranches.ids.map((tid) => [id, tid, data.epoch.lastExecuted] as const)
          })
          .flat()

        const trancheIdToIndex: Record<string, number> = {}
        keys.forEach(([, tid], i) => {
          trancheIdToIndex[tid] = i
        })

        // modify keys for $issuance query [Tranche: [poolId, trancheId]]
        const issuanceKeys = keys.map(([poolId, trancheId]) => ({ Tranche: [poolId, trancheId] }))
        const $issuance = api.query.ormlTokens.totalIssuance.multi(issuanceKeys).pipe(take(1))

        const $prices = combineLatest(
          pools.map((p) => api.call.poolsApi.trancheTokenPrices(p.id).pipe(startWith(null))) as Observable<
            Codec[] | null
          >[]
        )

        const $navs = combineLatest(pools.map((p) => api.call.poolsApi.nav(p.id)) as Observable<Codec[] | null>[])

        const $block = inst.getBlocks().pipe(take(1))

        return combineLatest([$issuance, $block, $prices, $navs, getLatestTrancheSnapshots()]).pipe(
          map(([rawIssuances, { block }, rawPrices, rawNavs, yieldsAnnualized]) => {
            const blockNumber = block.header.number.toNumber()

            const yield30DaysTrancheId = yieldsAnnualized?.trancheSnapshots.nodes.reduce(
              (acc, { yield30DaysAnnualized, trancheId }) => {
                acc[trancheId] = yield30DaysAnnualized
                return acc
              },
              {} as Record<string, string | null>
            )
            const yield90DaysTrancheId = yieldsAnnualized?.trancheSnapshots.nodes.reduce(
              (acc, { yield90DaysAnnualized, trancheId }) => {
                acc[trancheId] = yield90DaysAnnualized
                return acc
              },
              {} as Record<string, string | null>
            )
            const yieldYTDTrancheId = yieldsAnnualized?.trancheSnapshots.nodes.reduce(
              (acc, { yieldYTD, trancheId }) => {
                acc[trancheId] = yieldYTD
                return acc
              },
              {} as Record<string, string | null>
            )
            const yieldInceptionTrancheId = yieldsAnnualized?.trancheSnapshots.nodes.reduce(
              (acc, { yieldSinceInception, trancheId }) => {
                acc[trancheId] = yieldSinceInception
                return acc
              },
              {} as Record<string, string | null>
            )

            const mappedPools = pools.map((poolObj, poolIndex) => {
              const { data: pool, id: poolId } = poolObj
              const metadata = metadataMap[poolId]
              const portfolioValuationData = portfolioValuationMap[poolId]
              const epochExecution = epochExecutionMap[poolId]
              const currency = findCurrency(currencies, pool.currency)!

              const poolValue = new CurrencyBalance(
                pool.tranches.tranches.reduce((prev: BN, tranche: TrancheDetailsData) => {
                  return new BN(prev.add(new BN(hexToBN(tranche.debt))).add(new BN(hexToBN(tranche.reserve))))
                }, new BN(0)),
                currency.decimals
              )

              const maxReserve = new CurrencyBalance(hexToBN(pool.reserve.max), currency.decimals)
              const availableReserve = new CurrencyBalance(hexToBN(pool.reserve.available), currency.decimals)
              const totalReserve = new CurrencyBalance(hexToBN(pool.reserve.total), currency.decimals)

              const lastUpdatedNav = new Date((portfolioValuationData?.lastUpdated ?? 0) * 1000).toISOString()
              // @ts-expect-error
              const rawNav = rawNavs && rawNavs[poolIndex]?.toJSON()

              const mappedPool: Omit<Pool, 'fees'> = {
                id: poolId,
                createdAt: null,
                metadata,
                currency,
                tranches: pool.tranches.tranches.map((tranche, index) => {
                  const trancheId = pool.tranches.ids[index]
                  const trancheKeyIndex = trancheIdToIndex[trancheId]
                  // const lastClosedEpoch = epochs[trancheKeyIndex]

                  let minRiskBuffer: Perquintill | null = null
                  let interestRatePerSec: Rate | null = null
                  if ('nonResidual' in tranche.trancheType) {
                    minRiskBuffer = new Perquintill(hexToBN(tranche.trancheType.nonResidual.minRiskBuffer))
                    interestRatePerSec = new Rate(hexToBN(tranche.trancheType.nonResidual.interestRatePerSec))
                  }

                  const subordinateTranchesValue = new CurrencyBalance(
                    pool.tranches.tranches.slice(0, index).reduce((prev: BN, tranche: TrancheDetailsData) => {
                      return new BN(prev.add(new BN(hexToBN(tranche.debt))).add(new BN(hexToBN(tranche.reserve))))
                    }, new BN(0)),
                    currency.decimals
                  )

                  // @ts-expect-error
                  const rawPrice = rawPrices?.[poolIndex]?.toPrimitive()?.[index]
                  const tokenPrice = rawPrice ? new Price(rawPrice) : Price.fromFloat(1)

                  const currentRiskBuffer = subordinateTranchesValue.gtn(0)
                    ? Perquintill.fromFloat(subordinateTranchesValue.toDecimal().div(poolValue.toDecimal()))
                    : new Perquintill(0)

                  const protection = minRiskBuffer?.toDecimal() ?? Dec(0)
                  const tvl = poolValue.toDecimal()
                  let capacityGivenMaxReserve = maxReserve.toDecimal().minus(totalReserve.toDecimal())
                  capacityGivenMaxReserve = capacityGivenMaxReserve.lt(0) ? Dec(0) : capacityGivenMaxReserve
                  const capacityGivenProtection = protection.isZero()
                    ? capacityGivenMaxReserve
                    : currentRiskBuffer.toDecimal().div(protection).mul(tvl).minus(tvl)
                  const capacity = capacityGivenMaxReserve.gt(capacityGivenProtection)
                    ? capacityGivenProtection
                    : capacityGivenMaxReserve

                  return {
                    id: trancheId,
                    index,
                    seniority: tranche.seniority,
                    tokenPrice,
                    poolCurrency: currency,
                    currency: findCurrency(currencies, { Tranche: [poolId, trancheId] })!,
                    totalIssuance: new TokenBalance(rawIssuances[trancheKeyIndex].toString(), currency.decimals),
                    poolId,
                    poolMetadata: (metadata ?? undefined) as string | undefined,
                    interestRatePerSec,
                    yield30DaysAnnualized: yield30DaysTrancheId?.[`${poolId}-${trancheId}`]
                      ? new Perquintill(yield30DaysTrancheId[`${poolId}-${trancheId}`]!)
                      : null,
                    yield90DaysAnnualized: yield90DaysTrancheId?.[`${poolId}-${trancheId}`]
                      ? new Perquintill(yield90DaysTrancheId[`${poolId}-${trancheId}`]!)
                      : null,
                    yieldYTD: yieldYTDTrancheId?.[`${poolId}-${trancheId}`]
                      ? new Perquintill(yieldYTDTrancheId[`${poolId}-${trancheId}`]!)
                      : null,
                    yieldSinceInception: yieldInceptionTrancheId?.[`${poolId}-${trancheId}`]
                      ? new Perquintill(yieldInceptionTrancheId[`${poolId}-${trancheId}`]!)
                      : null,
                    minRiskBuffer,
                    currentRiskBuffer,
                    capacity: CurrencyBalance.fromFloat(capacity, currency.decimals),
                    ratio: new Perquintill(hexToBN(tranche.ratio)),
                    lastUpdatedInterest: new Date(tranche.lastUpdatedInterest * 1000).toISOString(),
                    balance: new TokenBalance(hexToBN(tranche.debt).add(hexToBN(tranche.reserve)), currency.decimals),
                  }
                }),
                reserve: {
                  max: maxReserve,
                  available: availableReserve,
                  total: totalReserve,
                },
                epoch: {
                  ...pool.epoch,
                  lastClosed: new Date(pool.epoch.lastClosed * 1000).toISOString(),
                  status: getEpochStatus(epochExecution, blockNumber),
                  challengePeriodEnd: epochExecution?.challengePeriodEnd,
                },
                parameters: {
                  ...pool.parameters,
                  challengeTime: api.consts.poolSystem.challengeTime.toJSON() as number, // in blocks
                },
                nav: {
                  lastUpdated: lastUpdatedNav,
                  fees: new CurrencyBalance(hexToBN(rawNav?.navFees), currency.decimals),
                  total: new CurrencyBalance(hexToBN(rawNav?.total), currency.decimals),
                  aum: new CurrencyBalance(hexToBN(rawNav?.navAum), currency.decimals),
                },
                value: new CurrencyBalance(hexToBN(rawNav?.total), currency.decimals),
              }

              return mappedPool
            })

            return mappedPools
          })
        )
      }),
      combineLatestWith($query),
      map(([pools, gqlResult]) => {
        return pools.map((pool) => {
          const gqlPool = gqlResult?.pools.nodes.find((r) => r.id === pool.id)
          const poolWithGqlData: Pool = {
            ...pool,
            createdAt: gqlPool?.createdAt ?? null,
            fees: {
              totalPaid: new CurrencyBalance(gqlPool?.sumPoolFeesPaidAmount ?? 0, pool.currency.decimals),
              totalPending: new CurrencyBalance(gqlPool?.sumPoolFeesPendingAmount ?? 0, pool.currency.decimals),
            },
          }
          return poolWithGqlData
        })
      }),
      repeatWhen(() => $events)
    )
  }

  function getPool(args: [poolId: string]) {
    const [poolId] = args
    return getPools().pipe(
      map((pools) => {
        const pool = pools.find(({ id }) => id === poolId)
        if (!pool) throw new Error(`Pool not found with poolId: ${poolId}`)
        return pool
      })
    )
  }

  function getPoolCurrency(args: [poolId: string]) {
    const [poolId] = args
    return inst.getApi().pipe(
      switchMap((api) =>
        api.query.poolSystem.pool(poolId).pipe(
          switchMap((rawPool) => {
            const pool = rawPool.toPrimitive() as any
            return getCurrency(api, pool.currency)
          }),
          take(1)
        )
      )
    )
  }

  function getPoolFees(args: [poolId: string]) {
    const [poolId] = args

    const $events = inst.getEvents().pipe(
      filter(({ api, events }) => {
        const event = events.find(
          ({ event }) =>
            api.events.poolFees.Charged.is(event) ||
            api.events.poolFees.Added.is(event) ||
            api.events.poolFees.Removed.is(event) ||
            api.events.poolFees.Proposed.is(event)
        )
        return !!event
      })
    )

    return inst.getApi().pipe(
      switchMap((api) =>
        combineLatest([api.call.poolFeesApi.listFees(poolId), getPoolCurrency([poolId])]).pipe(
          map(([feesListData, currency]) => {
            const feesList = feesListData.toJSON() as { bucket: 'Top'; fees: ActivePoolFeesData[] }[]
            const fees: ActivePoolFees[] = feesList.flatMap((entry) => {
              return entry.fees.map((fee) => {
                const type = Object.keys(fee.amounts.feeType)[0] as FeeTypes
                const limit = Object.keys(fee.amounts.feeType[type].limit)[0] as FeeLimits
                const percentOfNav = new Rate(hexToBN(fee.amounts.feeType[type].limit[limit]))
                return {
                  ...fee,
                  position: entry.bucket,
                  type,
                  limit,
                  amounts: {
                    percentOfNav,
                    pending: new CurrencyBalance(
                      new BN(fee.amounts.pending).iadd(new BN(fee.amounts.disbursement)),
                      currency.decimals
                    ),
                  },
                }
              })
            })
            return fees
          }),
          repeatWhen(() => $events)
        )
      )
    )
  }

  function getLatestTrancheSnapshots() {
    return inst.getSubqueryObservable<{
      trancheSnapshots: {
        nodes: {
          yield30DaysAnnualized: string | null
          yield90DaysAnnualized: string | null
          yieldYTD: string | null
          yieldSinceInception: string | null
          trancheId: string
        }[]
      }
    }>(
      `{
        trancheSnapshots(distinct: TRANCHE_ID, orderBy: TIMESTAMP_DESC) {
          nodes {
            trancheId
            yield30DaysAnnualized
            yield90DaysAnnualized
            yieldYTD
            yieldSinceInception
          }
        }
      }`
    )
  }
  function getPoolSnapshotsWithCursor(poolId: string, endCursor: string | null, from?: Date, to?: Date) {
    // Default values for invalid dates
    const defaultFrom = getDateYearsFromNow(-10).toISOString()
    const defaultTo = getDateYearsFromNow(10).toISOString()

    // Use valid dates or default values
    const validFrom = isValidDate(from) ? from?.toISOString() : defaultFrom
    const validTo = isValidDate(to) ? to?.toISOString() : defaultTo

    return inst.getSubqueryObservable<{
      poolSnapshots: { nodes: SubqueryPoolSnapshot[]; pageInfo: { hasNextPage: boolean; endCursor: string } }
    }>(
      `query($poolId: String!, $from: Datetime!, $to: Datetime!, $poolCursor: Cursor) {
      poolSnapshots(
        orderBy: BLOCK_NUMBER_ASC,
        filter: {
          poolId: { equalTo: $poolId },
          timestamp: { greaterThan: $from, lessThan: $to },
          epochExists: false
        }
        after: $poolCursor
      ) {
        nodes {
          id
          timestamp
          netAssetValue
          totalReserve
          offchainCashValue
          portfolioValuation
          blockNumber
          sumPoolFeesChargedAmountByPeriod
          sumPoolFeesAccruedAmountByPeriod
          sumPoolFeesPaidAmountByPeriod
          sumPoolFeesPendingAmount
          sumBorrowedAmountByPeriod
          sumRepaidAmountByPeriod
          sumInvestedAmountByPeriod
          sumRedeemedAmountByPeriod
          sumPrincipalRepaidAmountByPeriod
          sumInterestRepaidAmountByPeriod
          sumUnscheduledRepaidAmountByPeriod
          sumInterestAccruedByPeriod
          sumDebtWrittenOffByPeriod
          sumRealizedProfitFifoByPeriod
          sumUnrealizedProfitAtMarketPrice
          sumUnrealizedProfitAtNotional
          sumUnrealizedProfitByPeriod
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
    `,
      {
        poolId,
        from: validFrom,
        to: validTo,
        poolCursor: endCursor,
      }
    )
  }

  function getTrancheSnapshotsWithCursor(
    filterBy: { poolId: string } | { trancheIds: string[] },
    endCursor: string | null,
    from?: Date,
    to?: Date
  ) {
    const defaultFrom = getDateYearsFromNow(-10).toISOString()
    const defaultTo = getDateYearsFromNow(10).toISOString()

    const validFrom = isValidDate(from) ? from?.toISOString() : defaultFrom
    const validTo = isValidDate(to) ? to?.toISOString() : defaultTo

    const filter: any = {
      timestamp: {
        greaterThan: validFrom,
        lessThan: validTo,
      },
    }
    if ('poolId' in filterBy) {
      filter.tranche = { poolId: { equalTo: filterBy.poolId } }
    } else if ('trancheIds' in filterBy) {
      filter.tranche = { trancheId: { in: filterBy.trancheIds } }
    }

    return inst.getSubqueryObservable<{
      trancheSnapshots: { nodes: SubqueryTrancheSnapshot[]; pageInfo: { hasNextPage: boolean; endCursor: string } }
    }>(
      `query($filter: TrancheSnapshotFilter, $trancheCursor: Cursor) {
        trancheSnapshots(
          orderBy: BLOCK_NUMBER_ASC,
          filter: $filter
          after: $trancheCursor
        ) {
          nodes {
            tranche {
              poolId
              trancheId
            }
            timestamp
            tokenSupply
            tokenPrice
            sumOutstandingInvestOrdersByPeriod
            sumOutstandingRedeemOrdersByPeriod
            sumFulfilledInvestOrdersByPeriod
            sumFulfilledRedeemOrdersByPeriod
            yield7DaysAnnualized
            yield30DaysAnnualized
            yield90DaysAnnualized
            yieldSinceInception
            yieldMTD
            yieldQTD
            yieldYTD
            yieldSinceLastPeriod
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
    }
    `,
      {
        filter,
        trancheCursor: endCursor,
      }
    )
  }

  function getDailyTrancheStates(
    args: [filter: { poolId: string } | { trancheIds: string[] }, from?: Date, to?: Date]
  ) {
    const [filter, from, to] = args

    return of({ trancheSnapshots: [], endCursor: null, hasNextPage: true }).pipe(
      expand(({ trancheSnapshots, endCursor, hasNextPage }) => {
        if (!hasNextPage) return EMPTY
        return getTrancheSnapshotsWithCursor(filter, endCursor, from, to).pipe(
          map((response) => {
            if (response?.trancheSnapshots) {
              const { endCursor, hasNextPage } = response.trancheSnapshots.pageInfo

              return {
                endCursor,
                hasNextPage,
                trancheSnapshots: [...trancheSnapshots, ...response.trancheSnapshots.nodes],
              }
            }
            return {}
          })
        )
      }),
      takeLast(1),
      map(({ trancheSnapshots }) => {
        const trancheStates: Record<
          string,
          {
            timestamp: string
            tokenPrice: Price
            yield30DaysAnnualized: Perquintill
            yield90DaysAnnualized: Perquintill
          }[]
        > = {}
        trancheSnapshots?.forEach((state) => {
          const tid = state.tranche.trancheId
          const entry = {
            timestamp: state.timestamp,
            tokenPrice: new Price(state.tokenPrice),
            pool: state.tranche.poolId,
            yield30DaysAnnualized: state.yield30DaysAnnualized
              ? new Perquintill(state.yield30DaysAnnualized)
              : new Perquintill(0),
            yield90DaysAnnualized: state.yield90DaysAnnualized
              ? new Perquintill(state.yield90DaysAnnualized)
              : new Perquintill(0),
          }
          if (trancheStates[tid]) {
            trancheStates[tid].push(entry)
          } else {
            trancheStates[tid] = [entry]
          }
        })
        return trancheStates
      })
    )
  }

  function getDailyPoolStates(args: [poolId: string, from?: Date, to?: Date]) {
    const [poolId, from, to] = args

    return forkJoin([
      of({ poolSnapshots: [], endCursor: null, hasNextPage: true }).pipe(
        expand(({ poolSnapshots, endCursor, hasNextPage }) => {
          if (!hasNextPage) return EMPTY
          return getPoolSnapshotsWithCursor(poolId, endCursor, from, to).pipe(
            map((response) => {
              if (response?.poolSnapshots) {
                const { endCursor, hasNextPage } = response.poolSnapshots.pageInfo

                return {
                  endCursor,
                  hasNextPage,
                  poolSnapshots: [...poolSnapshots, ...response.poolSnapshots.nodes],
                }
              }
              return {}
            })
          )
        })
      ),
      of({ trancheSnapshots: [], endCursor: null, hasNextPage: true }).pipe(
        expand(({ trancheSnapshots, endCursor, hasNextPage }) => {
          if (!hasNextPage) return EMPTY
          return getTrancheSnapshotsWithCursor({ poolId }, endCursor, from, to).pipe(
            map((response) => {
              if (response?.trancheSnapshots) {
                const { endCursor, hasNextPage } = response.trancheSnapshots.pageInfo

                return {
                  endCursor,
                  hasNextPage,
                  trancheSnapshots: [...trancheSnapshots, ...response.trancheSnapshots.nodes],
                }
              }
              return {}
            })
          )
        })
      ),
      getPoolCurrency([poolId]),
    ]).pipe(
      map(([{ poolSnapshots }, { trancheSnapshots }, poolCurrency]) => {
        const trancheStates: Record<string, { timestamp: string; tokenPrice: Price }[]> = {}
        trancheSnapshots?.forEach((state) => {
          const tid = state.tranche.trancheId
          const entry = { timestamp: state.timestamp.slice(0, 10), tokenPrice: new Price(state.tokenPrice) }
          if (trancheStates[tid]) {
            trancheStates[tid].push(entry)
          } else {
            trancheStates[tid] = [entry]
          }
        })

        // One day may have multiple snapshots
        // Fields ending with an ByPeriod are reset to 0 in between each snapshot
        // So those fields need to be summed up
        const snapshotByDay = new Map<string, any>()
        return {
          poolStates:
            poolSnapshots?.flatMap((state) => {
              const timestamp = state.timestamp.slice(0, 10)
              const snapshotToday = snapshotByDay.get(timestamp)
              const poolState = {
                id: state.id,
                netAssetValue: new CurrencyBalance(state.netAssetValue, poolCurrency.decimals),
                totalReserve: new CurrencyBalance(state.totalReserve, poolCurrency.decimals),
                offchainCashValue: new CurrencyBalance(state.offchainCashValue, poolCurrency.decimals),
                portfolioValuation: new CurrencyBalance(state.portfolioValuation, poolCurrency.decimals),
                sumPoolFeesChargedAmountByPeriod: new CurrencyBalance(
                  BigInt(state.sumPoolFeesChargedAmountByPeriod) +
                    BigInt(snapshotToday?.sumPoolFeesChargedAmountByPeriod ?? 0),
                  poolCurrency.decimals
                ),
                sumPoolFeesAccruedAmountByPeriod: new CurrencyBalance(
                  BigInt(state.sumPoolFeesAccruedAmountByPeriod) +
                    BigInt(snapshotToday?.sumPoolFeesAccruedAmountByPeriod ?? 0),
                  poolCurrency.decimals
                ),
                sumPoolFeesPaidAmountByPeriod: new CurrencyBalance(
                  BigInt(state.sumPoolFeesPaidAmountByPeriod) +
                    BigInt(snapshotToday?.sumPoolFeesPaidAmountByPeriod ?? 0),
                  poolCurrency.decimals
                ),
                sumBorrowedAmountByPeriod: new CurrencyBalance(state.sumBorrowedAmountByPeriod, poolCurrency.decimals),
                sumPrincipalRepaidAmountByPeriod: new CurrencyBalance(
                  BigInt(state.sumPrincipalRepaidAmountByPeriod) +
                    BigInt(snapshotToday?.sumPrincipalRepaidAmountByPeriod ?? 0),
                  poolCurrency.decimals
                ),
                sumInterestRepaidAmountByPeriod: new CurrencyBalance(
                  BigInt(state.sumInterestRepaidAmountByPeriod) +
                    BigInt(snapshotToday?.sumInterestRepaidAmountByPeriod ?? 0),
                  poolCurrency.decimals
                ),
                sumUnscheduledRepaidAmountByPeriod: new CurrencyBalance(
                  BigInt(state.sumUnscheduledRepaidAmountByPeriod) +
                    BigInt(snapshotToday?.sumUnscheduledRepaidAmountByPeriod ?? 0),
                  poolCurrency.decimals
                ),
                sumRepaidAmountByPeriod: new CurrencyBalance(
                  BigInt(state.sumRepaidAmountByPeriod) + BigInt(snapshotToday?.sumRepaidAmountByPeriod ?? 0),
                  poolCurrency.decimals
                ),
                sumInvestedAmountByPeriod: new CurrencyBalance(
                  BigInt(state.sumInvestedAmountByPeriod) + BigInt(snapshotToday?.sumInvestedAmountByPeriod ?? 0),
                  poolCurrency.decimals
                ),
                sumRedeemedAmountByPeriod: new CurrencyBalance(
                  BigInt(state.sumRedeemedAmountByPeriod) + BigInt(snapshotToday?.sumRedeemedAmountByPeriod ?? 0),
                  poolCurrency.decimals
                ),
                sumPoolFeesPendingAmount: new CurrencyBalance(state.sumPoolFeesPendingAmount, poolCurrency.decimals),
                sumDebtWrittenOffByPeriod: new CurrencyBalance(
                  BigInt(state.sumDebtWrittenOffByPeriod) + BigInt(snapshotToday?.sumDebtWrittenOffByPeriod ?? 0),
                  poolCurrency.decimals
                ),
                sumInterestAccruedByPeriod: new CurrencyBalance(
                  BigInt(state.sumInterestAccruedByPeriod) + BigInt(snapshotToday?.sumInterestAccruedByPeriod ?? 0),
                  poolCurrency.decimals
                ),
                sumRealizedProfitFifoByPeriod: new CurrencyBalance(
                  BigInt(state.sumRealizedProfitFifoByPeriod) +
                    BigInt(snapshotToday?.sumRealizedProfitFifoByPeriod ?? 0),
                  poolCurrency.decimals
                ),
                sumUnrealizedProfitAtMarketPrice: new CurrencyBalance(
                  state.sumUnrealizedProfitAtMarketPrice,
                  poolCurrency.decimals
                ),
                sumUnrealizedProfitAtNotional: new CurrencyBalance(
                  state.sumUnrealizedProfitAtNotional,
                  poolCurrency.decimals
                ),
                sumUnrealizedProfitByPeriod: new CurrencyBalance(
                  BigInt(state.sumUnrealizedProfitByPeriod) + BigInt(snapshotToday?.sumUnrealizedProfitByPeriod ?? 0),
                  poolCurrency.decimals
                ),
              }

              snapshotByDay.set(timestamp, poolState)
              if (snapshotToday) {
                Object.assign(snapshotToday, poolState)
                return []
              }

              const poolValue = new CurrencyBalance(new BN(state?.netAssetValue || '0'), poolCurrency.decimals)

              // TODO: This is inefficient, would be better to construct a map indexed by the timestamp
              const trancheSnapshotsToday = trancheSnapshots?.filter((t) => t.timestamp.slice(0, 10) === timestamp)
              if (!trancheSnapshotsToday?.length) return []
              const tranches: { [trancheId: string]: DailyTrancheState } = {}
              trancheSnapshotsToday?.forEach((tranche) => {
                const tid = tranche.tranche.trancheId
                tranches[tid] = {
                  id: tranche.trancheId,
                  price: tranche.tokenPrice ? new Price(tranche.tokenPrice) : null,
                  tokenSupply: new TokenBalance(tranche.tokenSupply, poolCurrency.decimals),
                  fulfilledInvestOrders: new CurrencyBalance(
                    tranche.sumFulfilledInvestOrdersByPeriod,
                    poolCurrency.decimals
                  ),
                  fulfilledRedeemOrders: new CurrencyBalance(
                    tranche.sumFulfilledRedeemOrdersByPeriod,
                    poolCurrency.decimals
                  ),
                  outstandingInvestOrders: new CurrencyBalance(
                    tranche.sumOutstandingInvestOrdersByPeriod,
                    poolCurrency.decimals
                  ),
                  outstandingRedeemOrders: new CurrencyBalance(
                    tranche.sumOutstandingRedeemOrdersByPeriod,
                    poolCurrency.decimals
                  ),
                  yield7DaysAnnualized: tranche.yield7DaysAnnualized
                    ? new Perquintill(tranche.yield7DaysAnnualized)
                    : new Perquintill(0),
                  yield30DaysAnnualized: tranche.yield30DaysAnnualized
                    ? new Perquintill(tranche.yield30DaysAnnualized)
                    : new Perquintill(0),
                  yield90DaysAnnualized: tranche.yield90DaysAnnualized
                    ? new Perquintill(tranche.yield90DaysAnnualized)
                    : new Perquintill(0),
                  yieldSinceInception: tranche.yieldSinceInception
                    ? new Perquintill(tranche.yieldSinceInception)
                    : new Perquintill(0),
                  yieldMTD: tranche.yieldMTD ? new Perquintill(tranche.yieldMTD) : new Perquintill(0),
                  yieldQTD: tranche.yieldQTD ? new Perquintill(tranche.yieldQTD) : new Perquintill(0),
                  yieldYTD: tranche.yieldYTD ? new Perquintill(tranche.yieldYTD) : new Perquintill(0),
                  yieldSinceLastPeriod: tranche.yieldSinceLastPeriod
                    ? new Perquintill(tranche.yieldSinceLastPeriod)
                    : new Perquintill(0),
                }
              })
              return { ...state, poolState, poolValue, tranches }
            }) || [],
          trancheStates,
        }
      })
    )
  }

  function getDailyTVL() {
    const $query = inst.getSubqueryObservable<{
      poolSnapshots: {
        nodes: {
          netAssetValue: string
          periodId: string
          pool: {
            currency: {
              decimals: number
            }
          }
        }[]
      }
    }>(
      `query {
        poolSnapshots(first: 1000, orderBy: PERIOD_ID_ASC, epochExists: false) {
          nodes {
            netAssetValue
            periodId
            pool {
              currency {
                decimals
              }
            }
          }
        }
      }`
    )

    return $query.pipe(
      map((data) => {
        if (!data) {
          return []
        }

        const mergedMap = new Map()
        const formatted = data.poolSnapshots.nodes.map(({ netAssetValue, periodId, pool }) => ({
          dateInMilliseconds: new Date(periodId).getTime(),
          tvl: new CurrencyBalance(new BN(netAssetValue || '0'), pool.currency.decimals).toDecimal(),
        }))

        formatted.forEach((entry) => {
          const { dateInMilliseconds, tvl } = entry

          if (mergedMap.has(dateInMilliseconds)) {
            mergedMap.set(dateInMilliseconds, mergedMap.get(dateInMilliseconds).add(tvl))
          } else {
            mergedMap.set(dateInMilliseconds, tvl)
          }
        })

        return Array.from(mergedMap, ([dateInMilliseconds, tvl]) => ({ dateInMilliseconds, tvl }))
      })
    )
  }

  function getDailyPoolFeeStates(args: [poolId: string, from?: Date, to?: Date]) {
    const [poolId, from, to] = args
    return inst
      .getSubqueryObservable<{
        poolFeeSnapshots: { nodes: SubqueryPoolFeeSnapshot[] }
      }>(
        `query($poolId: String!, $from: Datetime!, $to: Datetime!) {
        poolFeeSnapshots(
          orderBy: BLOCK_NUMBER_ASC, 
          filter: {
            poolFeeId: { includes: $poolId }, 
            timestamp: { greaterThan: $from, lessThan: $to }
          }
        ) {
          nodes {
            id
            poolFeeId
            timestamp
            sumPaidAmount
            sumChargedAmount
            sumAccruedAmount
            sumPaidAmount
            pendingAmount
            sumAccruedAmountByPeriod
            sumPaidAmountByPeriod
            sumChargedAmountByPeriod
            poolFee {
              name
            }
          }
        }
      }
    `,
        {
          poolId,
          from: from ? from.toISOString() : getDateYearsFromNow(-10).toISOString(),
          to: to ? to.toISOString() : getDateYearsFromNow(10).toISOString(),
        }
      )
      .pipe(
        map((response) => {
          const poolFeeSnapshots = response?.poolFeeSnapshots || { nodes: [] }
          const poolFeesGroupedByFeeId = poolFeeSnapshots?.nodes.reduce((acc, snapshot) => {
            const feeId = snapshot.poolFeeId.split('-')[1]
            if (!acc[feeId]) {
              acc[feeId] = []
            }
            acc[feeId].push(snapshot)
            return acc
          }, {} as { [feeId: string]: SubqueryPoolFeeSnapshot[] })
          return poolFeesGroupedByFeeId
        }),
        combineLatestWith(getPoolCurrency([poolId])),
        map(([poolFeesGroupedByFeeId, poolCurrency]) => {
          const poolFeeStates: Record<string, DailyPoolFeesState[]> = {}
          Object.entries(poolFeesGroupedByFeeId).forEach(([feeId, snapshots]) => {
            poolFeeStates[feeId] = snapshots.map((snapshot) => ({
              timestamp: snapshot.timestamp,
              pendingAmount: new CurrencyBalance(snapshot.pendingAmount, poolCurrency.decimals),
              poolFee: {
                name: snapshot.poolFee.name,
              },
              poolFeeId: snapshot.poolFeeId,
              sumAccruedAmount: new CurrencyBalance(snapshot.sumAccruedAmount, poolCurrency.decimals),
              sumChargedAmount: new CurrencyBalance(snapshot.sumChargedAmount, poolCurrency.decimals),
              sumPaidAmount: new CurrencyBalance(snapshot.sumPaidAmount, poolCurrency.decimals),
              sumAccruedAmountByPeriod: new CurrencyBalance(snapshot.sumAccruedAmountByPeriod, poolCurrency.decimals),
              sumChargedAmountByPeriod: new CurrencyBalance(snapshot.sumChargedAmountByPeriod, poolCurrency.decimals),
              sumPaidAmountByPeriod: new CurrencyBalance(snapshot.sumPaidAmountByPeriod, poolCurrency.decimals),
            }))
          })
          return poolFeeStates
        })
      )
  }

  function getPoolFeeStatesByGroup(
    args: [poolId: string, from?: Date, to?: Date],
    groupBy: GroupBy = 'month'
  ): Observable<Record<string, DailyPoolFeesState[]>> {
    return getDailyPoolFeeStates(args).pipe(
      map((poolFees) => {
        return Object.fromEntries(
          Object.entries(poolFees).map(([feeId, feeStates]) => {
            if (!feeStates.length) return []
            const poolStatesByGroup: { [period: string]: DailyPoolFeesState } = {}

            feeStates.forEach((feeState) => {
              const date = new Date(feeState.timestamp)
              const period = getGroupByPeriod(date, groupBy)
              if (!poolStatesByGroup[period]) {
                poolStatesByGroup[period] = feeState
              } else {
                const existing = poolStatesByGroup[period]
                poolStatesByGroup[period] = {
                  ...feeState,
                  sumAccruedAmountByPeriod: new CurrencyBalance(
                    feeState.sumAccruedAmountByPeriod.add(existing?.sumAccruedAmountByPeriod ?? new BN(0)),
                    feeState.sumAccruedAmountByPeriod.decimals
                  ),
                  sumChargedAmountByPeriod: new CurrencyBalance(
                    feeState.sumChargedAmountByPeriod.add(existing?.sumChargedAmountByPeriod ?? new BN(0)),
                    feeState.sumChargedAmountByPeriod.decimals
                  ),
                  sumPaidAmountByPeriod: new CurrencyBalance(
                    feeState.sumPaidAmountByPeriod.add(existing?.sumPaidAmountByPeriod ?? new BN(0)),
                    feeState.sumPaidAmountByPeriod.decimals
                  ),
                }
              }
            })

            return [feeId, Object.values(poolStatesByGroup)]
          })
        )
      })
    )
  }

  function getAggregatedPoolFeeStatesByGroup(
    args: [poolId: string, from?: Date, to?: Date],
    groupBy: GroupBy = 'month'
  ) {
    return combineLatest([getDailyPoolFeeStates(args), getPoolCurrency([args[0]])]).pipe(
      map(([poolFeeStates, poolCurrency]) => {
        return Object.entries(poolFeeStates).map(([feeId, feeStates]) => {
          if (!feeStates.length) return []
          const feeStatesByGroup: { [period: string]: DailyPoolFeesState[] } = {}

          feeStates.forEach((poolState) => {
            const date = new Date(poolState.timestamp)
            const period = getGroupByPeriod(date, groupBy)
            if (!feeStatesByGroup[period]) {
              feeStatesByGroup[period] = []
            }

            feeStatesByGroup[period].push(poolState)
          })

          const aggregatedPoolStatesByGroup: { [period: string]: DailyPoolFeesState } = {}

          for (const period in feeStatesByGroup) {
            const feeStates = feeStatesByGroup[period]

            const feeStateKeys = Object.keys(feeStates.map((fee) => fee)[0]).filter(
              (key) => key !== 'poolFeeId' && key !== 'poolFee' && key !== 'timestamp'
            ) as Omit<keyof DailyPoolFeesState, 'poolFee' | 'poolFeeId' | 'timestamp'>[]

            const aggregates = feeStateKeys.reduce((total, key) => {
              const sum = feeStates.reduce((sum, feeState) => {
                return sum.add(Dec((feeState[key as keyof DailyPoolFeesState] as CurrencyBalance).toDecimal()))
              }, Dec(0))
              return {
                [key as keyof DailyPoolFeesState]: CurrencyBalance.fromFloat(sum.toString(), poolCurrency.decimals),
                ...total,
              }
            }, {} as Record<keyof DailyPoolFeesState, any>)

            aggregatedPoolStatesByGroup[period] = {
              ...aggregates,
              timestamp: feeStates.reverse()[0].timestamp,
              poolFee: { name: feeStates.reverse()[0].poolFee.name },
            }
          }

          return { [feeId]: Object.values(aggregatedPoolStatesByGroup) }
        })
      })
    )
  }

  function getAggregatedPoolStatesByGroup(args: [poolId: string, from?: Date, to?: Date], groupBy: GroupBy = 'month') {
    return combineLatest([getDailyPoolStates(args), getPoolCurrency([args[0]])]).pipe(
      map(([{ poolStates }, poolCurrency]) => {
        if (!poolStates.length) return []
        const poolStatesByGroup: { [period: string]: DailyPoolState[] } = {}

        poolStates.forEach((poolState) => {
          const date = new Date(poolState.timestamp)
          const period = getGroupByPeriod(date, groupBy)
          if (!poolStatesByGroup[period]) {
            poolStatesByGroup[period] = []
          }

          poolStatesByGroup[period].push(poolState)
        })

        const aggregatedPoolStatesByGroup: { [period: string]: Pick<DailyPoolState, 'poolState' | 'timestamp'> } = {}

        for (const period in poolStatesByGroup) {
          const poolStates = poolStatesByGroup[period]

          const poolStateKeys = Object.keys(poolStates.map(({ poolState }) => poolState)[0]).filter(
            (key) => key !== 'id'
          ) as Array<keyof DailyPoolState['poolState']>

          const aggregates = poolStateKeys.reduce((total, key) => {
            const sum = poolStates.reduce((sum, { poolState }) => sum.add(Dec(poolState[key].toDecimal())), Dec(0))
            return { [key]: CurrencyBalance.fromFloat(sum.toString(), poolCurrency.decimals), ...total }
          }, {} as Record<keyof DailyPoolState['poolState'], any>)

          aggregatedPoolStatesByGroup[period] = {
            poolState: { ...aggregates },
            timestamp: poolStates.reverse()[0].timestamp,
          }
        }

        return Object.values(aggregatedPoolStatesByGroup)
      })
    )
  }

  function getPoolStatesByGroup(args: [poolId: string, from?: Date, to?: Date], groupBy: GroupBy = 'month') {
    return getDailyPoolStates(args).pipe(
      map(({ poolStates }) => {
        if (!poolStates.length) return []
        const poolStatesByGroup: { [period: string]: DailyPoolState } = {}

        poolStates.forEach((poolState) => {
          const date = new Date(poolState.timestamp)
          const period = getGroupByPeriod(date, groupBy)
          if (!poolStatesByGroup[period] || new Date(poolStatesByGroup[period].timestamp) < date) {
            poolStatesByGroup[period] = poolState
          }
        })

        return Object.values(poolStatesByGroup)
      })
    )
  }

  function getTransactionsByAddress(args: [address: string, count?: number, txTypes?: InvestorTransactionType[]]) {
    const [address] = args

    const $query = inst.getSubqueryObservable<{
      investorTransactions: { nodes: SubqueryInvestorTransaction[] }
    }>(
      `query ($address: String) {
          investorTransactions(
            filter: {accountId: {equalTo: $address}}
            orderBy: TIMESTAMP_DESC
          ) {
            nodes {
              account {
                chainId
              }
              timestamp
              type
              poolId
              trancheId
              hash
              tokenAmount
              tokenPrice
              currencyAmount
            }
          }
        }
      `,
      {
        address: addressToHex(address),
      },
      false
    )

    return $query.pipe(
      switchMap((data) => {
        const poolIds = new Set(data?.investorTransactions.nodes.map((e) => e.poolId) ?? [])
        if (!poolIds.size) {
          return of({
            investorTransactions: [],
          })
        }
        const $poolCurrencies = Array.from(poolIds).map((poolId) => getPoolCurrency([poolId]))
        return combineLatest($poolCurrencies).pipe(
          map((currencies) => {
            const txs = data?.investorTransactions.nodes.map((tx) => {
              const currencyIndex = Array.from(poolIds).indexOf(tx.poolId)
              const poolCurrency = currencies[currencyIndex]
              return {
                ...tx,
                tokenAmount: new TokenBalance(tx.tokenAmount || 0, poolCurrency.decimals),
                tokenPrice: new Price(tx.tokenPrice || 0),
                currencyAmount: new CurrencyBalance(tx.currencyAmount || 0, poolCurrency.decimals),
                trancheId: tx.trancheId.split('-')[1],
              }
            })
            return {
              investorTransactions: txs || [],
            }
          })
        )
      })
    )
  }

  function getInvestorTransactions(args: [poolId: string, trancheId?: string, from?: Date, to?: Date]) {
    const [poolId, trancheId, from, to] = args

    const $query = inst.getSubqueryObservable<{
      investorTransactions: { nodes: SubqueryInvestorTransaction[] }
    }>(
      `query($poolId: String!, $trancheId: String, $from: Datetime!, $to: Datetime!) {
        investorTransactions(
          orderBy: TIMESTAMP_ASC,
          filter: {
            poolId: { equalTo: $poolId },
            timestamp: { greaterThan: $from, lessThan: $to },
            trancheId: { isNull: false, endsWith: $trancheId }
          }) {
          nodes {
            id
            timestamp
            accountId
            account {
              chainId
              evmAddress
            }
            hash
            poolId
            trancheId
            epochNumber
            type
            tokenAmount
            currencyAmount
            tokenPrice
            transactionFee
          }
        }
      }
      `,
      {
        poolId,
        trancheId,
        from: from ? from.toISOString() : getDateMonthsFromNow(-1).toISOString(),
        to: to ? to.toISOString() : new Date().toISOString(),
      },
      false
    )

    return combineLatest([$query, getPoolCurrency([poolId])]).pipe(
      switchMap(([queryData, currency]) => {
        const currencyDecimals = currency.decimals
        return [
          queryData?.investorTransactions.nodes.map((tx) => {
            return {
              id: tx.id,
              timestamp: new Date(tx.timestamp),
              accountId: tx.accountId,
              chainId: Number(tx.account.chainId),
              evmAddress: tx.account.evmAddress,
              trancheId: tx.trancheId.split('-')[1],
              epochNumber: tx.epochNumber,
              type: tx.type as InvestorTransactionType,
              currencyAmount: tx.currencyAmount ? new CurrencyBalance(tx.currencyAmount, currencyDecimals) : undefined,
              tokenAmount: tx.tokenAmount ? new CurrencyBalance(tx.tokenAmount, currencyDecimals) : undefined,
              tokenPrice: tx.tokenPrice ? new Price(tx.tokenPrice) : undefined,
              transactionFee: tx.transactionFee ? new CurrencyBalance(tx.transactionFee, 18) : undefined, // native tokenks are always denominated in 18
              hash: tx.hash,
            } satisfies InvestorTransaction
          }),
        ]
      })
    )
  }

  function getAssetTransactions(args: [poolId: string, from?: Date, to?: Date]) {
    const [poolId, from, to] = args

    return of({ assetTransactions: [], endCursor: null, hasNextPage: true }).pipe(
      expand(({ assetTransactions, endCursor, hasNextPage }) => {
        if (!hasNextPage) return EMPTY
        return getAssetTransactionsWithCursor(poolId, endCursor, from, to).pipe(
          map((response) => {
            if (response?.assetTransactions) {
              const { endCursor, hasNextPage } = response.assetTransactions.pageInfo

              return {
                endCursor,
                hasNextPage,
                assetTransactions: [...assetTransactions, ...response.assetTransactions.nodes],
              }
            }
            return {}
          })
        )
      }),
      takeLast(1),
      switchMap(({ assetTransactions }) => combineLatest([of(assetTransactions), getPoolCurrency([poolId])])),
      map(([transactions, currency]) => {
        return (
          transactions?.map((tx) => ({
            ...tx,
            amount: tx.amount ? new CurrencyBalance(tx.amount, currency.decimals) : undefined,
            principalAmount: tx.principalAmount
              ? new CurrencyBalance(tx.principalAmount, currency.decimals)
              : undefined,
            interestAmount: tx.interestAmount ? new CurrencyBalance(tx.interestAmount, currency.decimals) : undefined,
            realizedProfitFifo: tx.realizedProfitFifo
              ? new CurrencyBalance(tx.realizedProfitFifo, currency.decimals)
              : undefined,
            sumRealizedProfitFifo: tx.asset.sumRealizedProfitFifo
              ? new CurrencyBalance(tx.asset.sumRealizedProfitFifo, currency.decimals)
              : undefined,
            unrealizedProfitAtMarketPrice: tx.asset.unrealizedProfitAtMarketPrice
              ? new CurrencyBalance(tx.asset.unrealizedProfitAtMarketPrice, currency.decimals)
              : undefined,
            timestamp: new Date(`${tx.timestamp}+00:00`),
          })) || ([] satisfies AssetTransaction[])
        )
      })
    )
  }

  function getAssetTransactionsWithCursor(poolId: string, endCursor: string | null, from?: Date, to?: Date) {
    return inst.getSubqueryObservable<{
      assetTransactions: {
        nodes: SubqueryAssetTransaction[]
        pageInfo: { hasNextPage: boolean; endCursor: string }
      }
    }>(
      `query($poolId: String!, $from: Datetime!, $to: Datetime!, $after: Cursor) {
        assetTransactions(
          first: 100,
          orderBy: TIMESTAMP_ASC,
          after: $after,
          filter: {
            poolId: { equalTo: $poolId },
            timestamp: { greaterThan: $from, lessThan: $to },
          }) {
          nodes {
            principalAmount
            interestAmount
            epochId
            type
            timestamp
            amount
            settlementPrice
            quantity
            hash
            realizedProfitFifo
            asset {
              id
              metadata
              name
              type
              sumRealizedProfitFifo
              unrealizedProfitAtMarketPrice
            }
            fromAsset {
              id
              metadata
              name
              type
            }
            toAsset {
              id
              metadata
              name
              type
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }`,
      {
        poolId,
        from: from ? from.toISOString() : getDateYearsFromNow(-10).toISOString(),
        to: to ? to.toISOString() : new Date().toISOString(),
        after: endCursor,
      },
      false
    )
  }

  function getFeeTransactions(args: [poolId: string, from?: Date, to?: Date]) {
    const [poolId, from, to] = args

    const $query = inst.getSubqueryObservable<{
      poolFeeTransactions: { nodes: SubqueryPoolFeeTransaction[] }
    }>(
      `query($poolId: String!, $from: Datetime!, $to: Datetime!) {
        poolFeeTransactions(
          orderBy: TIMESTAMP_ASC,
          filter: {
            poolFee: { poolId: { equalTo: $poolId } },
            timestamp: { greaterThan: $from, lessThan: $to },
          }) {
          nodes {
            id
            type
            timestamp
            blockNumber
            epochNumber
            amount
            poolFee {
              feeId
            }
          }
        }
      }
      `,
      {
        poolId,
        from: from ? from.toISOString() : getDateMonthsFromNow(-1).toISOString(),
        to: to ? to.toISOString() : new Date().toISOString(),
      },
      false
    )

    return $query.pipe(
      switchMap(() => combineLatest([$query, getPoolCurrency([poolId])])),
      map(([data, currency]) => {
        return data!.poolFeeTransactions.nodes.map(
          (tx) =>
            ({
              ...tx,
              amount: tx.amount ? new CurrencyBalance(tx.amount, currency.decimals) : undefined,
              timestamp: new Date(`${tx.timestamp}+00:00`),
              poolFee: {
                feeId: Number(tx.poolFee.feeId),
              },
            } satisfies PoolFeeTransaction)
        )
      })
    )
  }

  function getOracleTransactions(args: [from?: Date, to?: Date]) {
    const [from, to] = args

    const $query = inst.getSubqueryObservable<{
      oracleTransactions: { nodes: SubqueryOracleTransaction[] }
    }>(
      `query($from: Datetime!, $to: Datetime!) {
        oracleTransactions(
          orderBy: TIMESTAMP_ASC,
          filter: {
            timestamp: { greaterThan: $from, lessThan: $to },
          }) {
          nodes {
            id
            timestamp
            key
            value
          }
        }
      }
      `,
      {
        from: from ? from.toISOString() : getDateMonthsFromNow(-1).toISOString(),
        to: to ? to.toISOString() : new Date().toISOString(),
      },
      false
    )

    return $query.pipe(
      map((data) => {
        return data!.oracleTransactions.nodes.map(
          (tx) =>
            ({
              ...tx,
              timestamp: new Date(`${tx.timestamp}+00:00`),
              value: tx.value ? new CurrencyBalance(tx.value, 18) : undefined,
            } satisfies OracleTransaction)
        )
      })
    )
  }

  function getAssetSnapshots(args: [poolId: string, loanId: string, from?: Date, to?: Date]) {
    const [poolId, loanId, from, to] = args

    const $query = inst.getSubqueryObservable<{
      assetSnapshots: { nodes: SubqueryPoolAssetSnapshot[] }
    }>(
      `query($assetId: String!, $from: Datetime!, $to: Datetime!) {
        assetSnapshots(
          first: 1000,
          orderBy: TIMESTAMP_ASC,
          filter: {
            assetId: { equalTo: $assetId },
            timestamp: { greaterThan: $from, lessThan: $to }
          }
        ) {
          nodes {
            assetId
            timestamp
            presentValue
            currentPrice
            outstandingPrincipal
            outstandingInterest
            outstandingDebt
            outstandingQuantity
            totalBorrowed
            totalRepaidPrincipal
            totalRepaidInterest
            totalRepaidUnscheduled
          }
        }
      }
      `,
      {
        assetId: `${poolId}-${loanId}`,
        from: from ? from.toISOString() : getDateYearsFromNow(-10).toISOString(),
        to: to ? to.toISOString() : new Date().toISOString(),
      },
      false
    )

    return $query.pipe(
      switchMap(() => combineLatest([$query, getPoolCurrency([poolId])])),
      map(([data, currency]) => {
        return data!.assetSnapshots.nodes.map((tx) => ({
          ...tx,
          presentValue: tx.presentValue ? new CurrencyBalance(tx.presentValue, currency.decimals) : undefined,
          currentPrice: tx.currentPrice ? new CurrencyBalance(tx.currentPrice, currency.decimals) : undefined,
          outstandingPrincipal: tx.outstandingPrincipal
            ? new CurrencyBalance(tx.outstandingPrincipal, currency.decimals)
            : undefined,
          outstandingInterest: tx.outstandingInterest
            ? new CurrencyBalance(tx.outstandingInterest, currency.decimals)
            : undefined,
          outstandingDebt: tx.outstandingDebt ? new CurrencyBalance(tx.outstandingDebt, currency.decimals) : undefined,
          outstandingQuantity: tx.outstandingQuantity
            ? new CurrencyBalance(tx.outstandingQuantity, currency.decimals)
            : undefined,
          totalBorrowed: tx.totalBorrowed ? new CurrencyBalance(tx.totalBorrowed, currency.decimals) : undefined,
          totalRepaidPrincipal: tx.totalRepaidPrincipal
            ? new CurrencyBalance(tx.totalRepaidPrincipal, currency.decimals)
            : undefined,
          totalRepaidInterest: tx.totalRepaidInterest
            ? new CurrencyBalance(tx.totalRepaidInterest, currency.decimals)
            : undefined,
          totalRepaidUnscheduled: tx.totalRepaidUnscheduled
            ? new CurrencyBalance(tx.totalRepaidUnscheduled, currency.decimals)
            : undefined,
          timestamp: new Date(`${tx.timestamp}+00:00`),
        })) satisfies AssetPoolSnapshot[]
      })
    )
  }

  function getAllPoolAssetSnapshots(args: [poolId: string, date: Date]) {
    const [poolId, date] = args

    const validDate = new Date(date)
    const from = new Date(validDate.setUTCHours(0, 0, 0, 0))
    const to = new Date(validDate.setUTCHours(23, 59, 59, 999))

    const $query = inst.getSubqueryObservable<{
      assetSnapshots: { nodes: SubqueryAssetSnapshot[] }
    }>(
      `query($poolId: String!, $from: Datetime!, $to: Datetime!) {
        assetSnapshots(
          first: 1000,
          orderBy: TIMESTAMP_ASC,
          filter: {
            asset: { poolId: { equalTo: $poolId } }
            timestamp: { greaterThan: $from, lessThan: $to }
          }
        ) {
          nodes {
            assetId
            timestamp
            totalRepaidUnscheduled
            outstandingInterest
            totalRepaidInterest
            currentPrice
            outstandingPrincipal
            totalRepaidPrincipal
            outstandingQuantity
            presentValue
            outstandingDebt
            asset {
              actualMaturityDate
              actualOriginationDate
              advanceRate
              collateralValue
              discountRate
              lossGivenDefault
              name
              notional
              probabilityOfDefault
              status
              sumRealizedProfitFifo
              unrealizedProfitAtMarketPrice
              valuationMethod
            }
          }
        }
      }`,
      {
        poolId: `${poolId}`,
        from,
        to,
      },
      false
    )

    const transformVal = (value: string | undefined | BN, currency: number): CurrencyBalance | undefined => {
      if (!value) return undefined
      return new CurrencyBalance(value, currency)
    }

    return $query.pipe(
      switchMap(() => combineLatest([$query, getPoolCurrency([poolId])])),
      map(([data, currency]) => {
        return data!.assetSnapshots.nodes.map((tx) => ({
          ...tx,
          assetId: tx.assetId,
          actualMaturityDate: tx.asset.actualMaturityDate || undefined,
          actualOriginationDate: tx.asset.actualOriginationDate || undefined,
          advanceRate: new Rate(tx.asset.advanceRate || '0').toPercent(),
          collateralValue: transformVal(tx.asset.collateralValue, currency.decimals),
          currentPrice: transformVal(tx.currentPrice, currency.decimals),
          discountRate: tx.asset.discountRate,
          faceValue:
            tx.asset.notional && tx.outstandingQuantity
              ? transformVal(
                  new BN(tx.asset.notional).mul(new BN(tx.outstandingQuantity)).div(new BN(10).pow(new BN(18))),
                  currency.decimals
                )
              : undefined,
          lossGivenDefault: tx.asset.lossGivenDefault,
          name: tx.asset.name,
          outstandingDebt: transformVal(tx.outstandingDebt, currency.decimals),
          outstandingInterest: transformVal(tx.outstandingInterest, currency.decimals),
          outstandingPrincipal: transformVal(tx.outstandingPrincipal, currency.decimals),
          outstandingQuantity: transformVal(tx.outstandingQuantity, 18),
          presentValue: transformVal(tx.presentValue, currency.decimals),
          probabilityOfDefault: tx.asset.probabilityOfDefault,
          status: tx.asset.status,
          sumRealizedProfitFifo: transformVal(tx.asset.sumRealizedProfitFifo, currency.decimals),
          timestamp: new Date(`${tx.timestamp}+00:00`),
          totalRepaidInterest: transformVal(tx.totalRepaidInterest, currency.decimals),
          totalRepaidPrincipal: transformVal(tx.totalRepaidPrincipal, currency.decimals),
          totalRepaidUnscheduled: transformVal(tx.totalRepaidUnscheduled, currency.decimals),
          unrealizedProfitAtMarketPrice: transformVal(tx.asset.unrealizedProfitAtMarketPrice, currency.decimals),
        })) satisfies AssetSnapshot[]
      })
    )
  }

  function getInvestors(args: [poolId: string, trancheId?: string]) {
    const [poolId, trancheId] = args
    const $query = inst.getApi().pipe(
      switchMap(() => {
        return inst.getSubqueryObservable<{
          trancheBalances: { nodes: SubqueryTrancheBalances[] }
          currencyBalances: { nodes: SubqueryCurrencyBalances[] }
        }>(
          `query($trancheId: String) {
            trancheBalances(
              filter: {
                trancheId: { startsWith: $trancheId }
              }) {
            nodes {
              accountId
              trancheId
              account {
                chainId
                evmAddress
              }
              pendingInvestCurrency
              claimableTrancheTokens
              sumClaimedTrancheTokens
              pendingRedeemTrancheTokens
              claimableCurrency
              sumClaimedCurrency
            }
          }

          currencyBalances(
            filter: {
              currency: { trancheId: { startsWith: $trancheId } }
            }) {
            nodes {
              accountId
              account {
                chainId
                evmAddress
              }
              currency {
                trancheId
              }
              amount
            }
          }
        }
        `,
          {
            trancheId: `${poolId}-${trancheId || ''}`,
          },
          false
        )
      })
    )

    return $query.pipe(
      switchMap(() => combineLatest([$query, getPoolCurrency([poolId])])),
      map(([data, currency]) => {
        // TODO: this should be a map by account ID + tranche ID
        const currencyBalancesByAccountId: Record<string, SubqueryCurrencyBalances> = {}
        data!.currencyBalances.nodes.forEach((balance) => {
          currencyBalancesByAccountId[`${balance.accountId}-${balance.currency.trancheId?.split('-')[1]}`] = balance
        })

        return data!.trancheBalances.nodes.map(
          (balance) =>
            ({
              accountId: balance.accountId,
              chainId: Number(balance.account?.chainId ?? 0),
              trancheId: balance.trancheId.split('-')[1],
              evmAddress: balance.account?.evmAddress,
              balance: new CurrencyBalance(
                currencyBalancesByAccountId[`${balance.accountId}-${balance.trancheId.split('-')[1]}`]?.amount ?? 0,
                currency.decimals
              ),
              pendingInvestCurrency: new CurrencyBalance(balance.pendingInvestCurrency, currency.decimals),
              claimableTrancheTokens: new CurrencyBalance(balance.claimableTrancheTokens, currency.decimals),
              sumClaimedTrancheTokens: new CurrencyBalance(balance.sumClaimedTrancheTokens, currency.decimals),
              pendingRedeemTrancheTokens: new CurrencyBalance(balance.pendingRedeemTrancheTokens, currency.decimals),
              claimableCurrency: new CurrencyBalance(balance.claimableCurrency, currency.decimals),
              sumClaimedCurrency: new CurrencyBalance(balance.sumClaimedCurrency, currency.decimals),
            } satisfies Holder)
        )
      })
    )
  }

  function getNativeCurrency() {
    return inst.getApi().pipe(
      map((api) => ({
        decimals: api.registry.chainDecimals[0],
        symbol: api.registry.chainTokens[0],
      }))
    )
  }

  function getCurrencies() {
    return inst.getApi().pipe(
      switchMap((api) => api.query.ormlAssetRegistry.metadata.entries()),
      map((rawMetas) => {
        const metas = rawMetas.map(([rawKey, rawValue]) => {
          const key = parseCurrencyKey((rawKey.toHuman() as any)[0])
          const value = rawValue.toPrimitive() as AssetCurrencyData
          const currency: CurrencyMetadata = {
            key,
            decimals: value.decimals,
            name: value.symbol === 'USDC' ? 'Native USDC' : value.symbol === 'localUSDC' ? 'USDC' : value.name,
            symbol: value.symbol === 'USDC' ? 'nUSDC' : value.symbol === 'localUSDC' ? 'USDC' : value.symbol,
            isPoolCurrency: value.additional.poolCurrency,
            isPermissioned: value.additional.permissioned,
            additional: value.additional,
            location: value.location,
            displayName: value.symbol.includes('USDC') ? 'USDC' : value.symbol.includes('FRAX') ? 'FRAX' : value.symbol,
          }
          return currency
        })
        return metas
      })
    )
  }

  function getBalances(args: [address: Account]) {
    const [address] = args
    const $api = inst.getApi()

    const $events = inst.getEvents()

    return $api.pipe(
      switchMap((api) =>
        combineLatest([
          api.query.ormlTokens.accounts.entries(address),
          api.query.system.account(address),
          api.query.balances.locks(address),
          getCurrencies(),
        ]).pipe(
          take(1),
          map(([rawBalances, nativeBalance, nativeLocks, currencies]) => {
            const balances = {
              tranches: [] as AccountTokenBalance[],
              currencies: [] as AccountCurrencyBalance[],
              native: {
                balance: new CurrencyBalance(
                  (nativeBalance as any).data.free.toString(),
                  api.registry.chainDecimals[0]
                ),
                locked: new CurrencyBalance(
                  (nativeLocks as unknown as AccountNativeLock[]).reduce(
                    (sum, lock) => sum.add(new BN(lock.amount.toString())),
                    new BN(0)
                  ),
                  api.registry.chainDecimals[0]
                ),
                currency: {
                  decimals: api.registry.chainDecimals[0],
                  symbol: api.registry.chainTokens[0],
                },
              },
            }

            rawBalances.forEach(([rawKey, rawValue]) => {
              const key = parseCurrencyKey((rawKey.toHuman() as any)[1] as CurrencyKey)
              const value = rawValue.toJSON() as {
                free: string | number
                reserved: string | number
                frozen: string | number
              }

              const currency = findCurrency(currencies, key)

              if (!currency) return

              if (typeof key !== 'string' && 'Tranche' in key) {
                const [pid, trancheId] = key.Tranche
                const poolId = pid.replace(/\D/g, '')
                if (value.free !== 0 || value.reserved !== 0) {
                  const balance = hexToBN(value.free).add(hexToBN(value.reserved))

                  balances.tranches.push({
                    currency,
                    poolId,
                    trancheId,
                    balance: new TokenBalance(balance, currency.decimals),
                  })
                }
              } else {
                if (value.free !== 0 || value.reserved !== 0) {
                  const balance = hexToBN(value.free).add(hexToBN(value.reserved))

                  balances.currencies.push({
                    currency,
                    balance: new CurrencyBalance(balance, currency.decimals),
                  })
                }
              }
            })

            return balances
          })
        )
      ),

      repeatWhen(() => $events)
    )
  }

  function getPortfolio(args: [address: Account]) {
    const [address] = args

    return inst.getApi().pipe(
      switchMap((api) => api.call.investmentsApi.investmentPortfolio(address)),
      combineLatestWith(getCurrencies()),
      map(([data, currencies]) => {
        const results = data?.toPrimitive() as [
          { poolId: string; trancheId: string },
          {
            poolCurrencyId: RawCurrencyKey
            claimableCurrency: string | number
            claimableTrancheTokens: string | number
            pendingInvestCurrency: string | number
            pendingRedeemTrancheTokens: string | number
            freeTrancheTokens: string | number
            reservedTrancheTokens: string | number
          }
        ][]

        return Object.fromEntries(
          results.map(([key, value]) => {
            const currency = findCurrency(currencies, parseCurrencyKey(value.poolCurrencyId))!
            return [
              key.trancheId,
              {
                poolCurrency: currency,
                claimableCurrency: new CurrencyBalance(value.claimableCurrency, currency.decimals),
                claimableTrancheTokens: new TokenBalance(value.claimableTrancheTokens, currency.decimals),
                pendingInvestCurrency: new CurrencyBalance(value.pendingInvestCurrency, currency.decimals),
                pendingRedeemTrancheTokens: new TokenBalance(value.pendingRedeemTrancheTokens, currency.decimals),
                freeTrancheTokens: new TokenBalance(value.freeTrancheTokens, currency.decimals),
                reservedTrancheTokens: new TokenBalance(value.reservedTrancheTokens, currency.decimals),
              },
            ]
          })
        )
      })
    )
  }

  function getOrder(args: [address: Account, poolId: string, trancheId: string]) {
    const [address, poolId, trancheId] = args

    return inst.getApi().pipe(
      switchMap((api) =>
        combineLatest([
          api.queryMulti([
            [api.query.investments.investOrders, [address, [poolId, trancheId]]],
            [api.query.investments.redeemOrders, [address, [poolId, trancheId]]],
          ]),
          getPoolCurrency([poolId]),
        ])
      ),
      map(([[rawInvest, rawRedeem], currency]) => {
        const invest = rawInvest.toJSON() as any
        const redeem = rawRedeem.toJSON() as any

        return {
          currency,
          invest: new CurrencyBalance(invest ? hexToBN(invest.amount) : 0, currency.decimals),
          redeem: new TokenBalance(redeem ? hexToBN(redeem.amount) : 0, currency.decimals),
          submittedAt: (invest?.submittedAt
            ? Number(invest.submittedAt)
            : redeem?.submittedAt
            ? Number(redeem.submittedAt)
            : 0) as number,
        }
      })
    )
  }

  function getPoolAccountOrders(args: [poolId: string]) {
    const [poolId] = args

    const $events = inst.getEvents().pipe(
      filter(({ api, events }) => {
        const event = events.find(
          ({ event }) =>
            api.events.poolSystem.EpochClosed.is(event) ||
            api.events.poolSystem.EpochExecuted.is(event) ||
            api.events.investments.InvestOrderUpdated.is(event) ||
            api.events.investments.RedeemOrderUpdated.is(event)
        )
        return !!event
      })
    )
    return inst.getApi().pipe(
      switchMap((api) =>
        combineLatest([api.query.investments.investOrders.keys(), api.query.investments.redeemOrders.keys()]).pipe(
          switchMap(([investKeys, redeemKeys]) => {
            const keys = [...investKeys, ...redeemKeys]
              .map((k, i) => {
                const key = k.toHuman() as [string, [poolId: string, trancheId: string]]
                return {
                  accountId: addressToHex(key[0]),
                  poolId: key[1][0].replace(/\D/g, ''),
                  trancheId: key[1][1],
                  type: i >= investKeys.length ? 'redeem' : 'invest',
                }
              })
              .filter((k) => k.poolId === poolId && k)
            return api
              .queryMulti(
                keys.map((key) => [
                  key.type === 'invest' ? api.query.investments.investOrders : api.query.investments.redeemOrders,
                  [key.accountId, [key.poolId, key.trancheId]],
                ])
              )
              .pipe(
                map((orders) => {
                  return keys
                    .map((key, i) => {
                      const order = orders[i].toPrimitive() as { amount: string; submittedAt: number }
                      return {
                        ...key,
                        amount: new BN(order.amount),
                        submittedAt: order.submittedAt,
                      }
                    })
                    .filter((order) => order.amount.gt(new BN(0)))
                })
              )
          })
        )
      ),
      repeatWhen(() => $events)
    )
  }

  function getPoolOrders(args: [poolId: string]) {
    const [poolId] = args

    const $events = inst.getEvents().pipe(
      filter(({ api, events }) => {
        const event = events.find(
          ({ event }) =>
            api.events.poolSystem.EpochClosed.is(event) ||
            api.events.poolSystem.EpochExecuted.is(event) ||
            api.events.investments.InvestOrderUpdated.is(event) ||
            api.events.investments.RedeemOrderUpdated.is(event)
        )
        return !!event
      })
    )
    return inst.getApi().pipe(
      switchMap(
        (api) => api.query.poolSystem.pool(poolId),
        (api, pool) => ({ api, pool })
      ),
      switchMap(({ api, pool: rawPool }) => {
        const pool = rawPool.toHuman() as PoolDetailsData
        const trancheIds = pool.tranches.ids
        return combineLatest([
          api.queryMulti(
            trancheIds.flatMap((trancheId) => [
              [api.query.investments.activeInvestOrders, [poolId, trancheId]],
              [api.query.investments.activeRedeemOrders, [poolId, trancheId]],
              [api.query.investments.inProcessingInvestOrders, [poolId, trancheId]],
              [api.query.investments.inProcessingRedeemOrders, [poolId, trancheId]],
            ])
          ),
          getPoolCurrency([poolId]),
        ])
      }),
      map(([allOrders, currency]) => {
        const n = 4
        const tranches = Array.from({ length: allOrders.length / n }, (_, i) => {
          const [rawActiveInvest, rawActiveRedeem, rawInProcessingInvest, rawInProcessingRedeem] = allOrders.slice(
            i * n,
            i * n + n
          )

          const activeInvest = new CurrencyBalance(
            hexToBN((rawActiveInvest.toJSON() as any)?.amount ?? '0x0'),
            currency.decimals
          )
          const activeRedeem = new CurrencyBalance(
            hexToBN((rawActiveRedeem.toJSON() as any)?.amount ?? '0x0'),
            currency.decimals
          )
          const inProcessingInvest = new CurrencyBalance(
            hexToBN((rawInProcessingInvest.toJSON() as any)?.amount ?? '0x0'),
            currency.decimals
          )
          const inProcessingRedeem = new CurrencyBalance(
            hexToBN((rawInProcessingRedeem.toJSON() as any)?.amount ?? '0x0'),
            currency.decimals
          )
          return {
            activeInvest,
            activeRedeem,
            inProcessingInvest,
            inProcessingRedeem,
            outstandingInvest: new CurrencyBalance(activeInvest.add(inProcessingInvest), currency.decimals),
            outstandingRedeem: new CurrencyBalance(activeRedeem.add(inProcessingRedeem), currency.decimals),
          }
        })

        return tranches
      }),
      repeatWhen(() => $events)
    )
  }

  function getPoolOrdersById(args: [poolId: string]) {
    const [poolId] = args

    const $query = inst.getSubqueryObservable<{
      epoches: { nodes: SubqueryPoolOrdersById[] }
    }>(
      `query($poolId: String!) {
        epoches(
          filter: {
            poolId: { equalTo: $poolId }
          }
        ) {
          nodes {
            poolId
            id
            sumPoolFeesPaidAmount
            closedAt
            epochStates{
              nodes{
                tokenPrice
                sumOutstandingInvestOrders
                sumFulfilledInvestOrders
                sumOutstandingRedeemOrders
                sumFulfilledRedeemOrders
              }
            }
            poolSnapshots{
              nodes{
                netAssetValue
              }
            }
          }
        }
      }
      `,
      {
        poolId,
      },
      false
    )

    return $query.pipe(
      combineLatestWith(getPoolCurrency([poolId])),
      map(([data, poolCurrency]) => {
        return data?.epoches?.nodes
          .map((order) => {
            const index = order.epochStates.nodes.length > 1 ? order.epochStates.nodes.length - 1 : 0
            const snapshotIndex = order.poolSnapshots.nodes.length > 1 ? order.poolSnapshots.nodes.length - 1 : 0
            return {
              epochId: order.id,
              closedAt: order.closedAt,
              paidFees: order.sumPoolFeesPaidAmount
                ? new CurrencyBalance(order.sumPoolFeesPaidAmount, poolCurrency.decimals)
                : null,
              tokenPrice: order.epochStates.nodes[index].tokenPrice
                ? new Price(order.epochStates.nodes[index].tokenPrice)
                : null,
              sumOutstandingInvestOrders: order.epochStates.nodes[index].sumOutstandingInvestOrders
                ? new CurrencyBalance(order.epochStates.nodes[index].sumOutstandingInvestOrders, poolCurrency.decimals)
                : null,
              sumFulfilledInvestOrders: order.epochStates.nodes[index].sumFulfilledInvestOrders
                ? new CurrencyBalance(order.epochStates.nodes[index].sumFulfilledInvestOrders, poolCurrency.decimals)
                : null,
              sumOutstandingRedeemOrders: order.epochStates.nodes[index].sumOutstandingRedeemOrders
                ? new CurrencyBalance(order.epochStates.nodes[index].sumOutstandingRedeemOrders, poolCurrency.decimals)
                : null,
              sumFulfilledRedeemOrders: order.epochStates.nodes[index].sumFulfilledRedeemOrders
                ? new CurrencyBalance(order.epochStates.nodes[index].sumFulfilledRedeemOrders, poolCurrency.decimals)
                : null,
              netAssetValue: order.poolSnapshots.nodes.length
                ? new CurrencyBalance(order.poolSnapshots.nodes[snapshotIndex].netAssetValue, poolCurrency.decimals)
                : null,
            }
          })
          .filter((order) => order.closedAt)
      })
    )
  }

  function getLoans(args: { poolIds: string[] }): Observable<Loan[]> {
    const { poolIds } = args
    const $api = inst.getApi()

    const poolIdSet = new Set(poolIds)

    const $events = inst.getEvents().pipe(
      filter(({ api, events }) => {
        const event = events.find(
          ({ event }) =>
            api.events.oraclePriceFeed.Fed.is(event) ||
            api.events.loans.Created.is(event) ||
            api.events.loans.Borrowed.is(event) ||
            api.events.loans.Repaid.is(event) ||
            api.events.loans.DebtTransferred.is(event) ||
            api.events.loans.WrittenOff.is(event) ||
            api.events.loans.Closed.is(event) ||
            api.events.loans.PortfolioValuationUpdated.is(event)
        )
        if (!event) return false
        const eventData = (event.toHuman() as any)?.event?.data
        const eventPoolId: string | undefined = eventData?.poolId
        if (!eventPoolId) return true
        const sanitizedEventPoolId = eventPoolId.replace(/\D/g, '')
        return poolIdSet.has(sanitizedEventPoolId)
      })
    )

    return $api.pipe(
      switchMap((api) => {
        // For each poolId, create an observable to fetch its loans
        const poolObservables = poolIds.map((poolId) => {
          return api.query.poolSystem.pool(poolId).pipe(
            take(1),
            switchMap((poolValue) => {
              if (!poolValue.toPrimitive()) return of([] as Loan[])

              return combineLatest([
                api.query.loans.createdLoan.entries(poolId),
                api.query.loans.activeLoans(poolId),
                api.query.loans.closedLoan.entries(poolId),
                api.query.oraclePriceFeed.fedValues.entries(),
                api.query.ormlAssetRegistry.metadata((poolValue.toPrimitive() as any).currency),
                api.call.loansApi.portfolio(poolId),
              ]).pipe(
                take(1),
                map(([createdLoanValues, activeLoanValues, closedLoanValues, oracles, rawCurrency, rawPortfolio]) => {
                  const currency = rawCurrency.toPrimitive() as AssetCurrencyData

                  // Process oracle prices
                  const oraclePrices: Record<
                    string,
                    {
                      timestamp: number
                      value: CurrencyBalance
                      account: string
                    }[]
                  > = {}
                  oracles.forEach((oracle) => {
                    const [value, timestamp] = oracle[1].toPrimitive() as any
                    const keys = oracle[0].toHuman() as any
                    const isin = keys[1]?.Isin
                    const account = keys[0]?.system?.Signed
                    if (!isin || !account) return
                    const entry = {
                      timestamp,
                      // Oracle prices always have 18 decimals on chain because they are used across pools
                      // When financing they are converted to the right number of decimals
                      value: new CurrencyBalance(value, 18),
                      account: addressToHex(account),
                    }
                    if (oraclePrices[isin]) {
                      oraclePrices[isin].push(entry)
                    } else {
                      oraclePrices[isin] = [entry]
                    }
                  })

                  // Process active loans portfolio
                  const activeLoansPortfolio: Record<
                    string,
                    {
                      presentValue: CurrencyBalance
                      outstandingPrincipal: CurrencyBalance
                      outstandingInterest: CurrencyBalance
                      currentPrice: CurrencyBalance
                    }
                  > = {}

                  ;(rawPortfolio as any).forEach(([key, value]: [Codec, Codec]) => {
                    const data = value.toPrimitive() as any
                    activeLoansPortfolio[String(key.toPrimitive())] = {
                      presentValue: new CurrencyBalance(data.presentValue, currency.decimals),
                      outstandingPrincipal: new CurrencyBalance(data.outstandingPrincipal, currency.decimals),
                      outstandingInterest: new CurrencyBalance(data.outstandingInterest, currency.decimals),
                      currentPrice: new CurrencyBalance(data.currentPrice ?? 0, currency.decimals),
                    }
                  })

                  // Helper function to extract shared loan info
                  function getSharedLoanInfo(loan: CreatedLoanData | ActiveLoanData | ClosedLoanData) {
                    const info = 'info' in loan ? loan.info : loan
                    const [collectionId, nftId] = info.collateral

                    // Active loans have additional info layer
                    const pricingInfo =
                      'info' in loan
                        ? 'external' in loan.info.pricing
                          ? loan.info.pricing.external
                          : loan.info.pricing.internal
                        : 'external' in loan.pricing
                        ? loan.pricing.external.info
                        : loan.pricing.internal.info

                    const interestRate =
                      'info' in loan
                        ? loan.info.interestRate.fixed.ratePerYear
                        : 'external' in loan.pricing
                        ? loan.pricing.external.interest.interestRate.fixed.ratePerYear
                        : loan.pricing.internal.interest.interestRate.fixed.ratePerYear

                    const discount =
                      'valuationMethod' in pricingInfo && 'discountedCashFlow' in pricingInfo.valuationMethod
                        ? pricingInfo.valuationMethod.discountedCashFlow
                        : undefined

                    return {
                      // Return the time the loans were fetched, in order to calculate a more accurate/up-to-date outstandingInterest
                      // Mainly for when repaying interest, to repay as close to the correct amount of interest
                      // Refetching before repaying would be another idea, but less practical with subscriptions
                      fetchedAt: new Date(),
                      asset: {
                        collectionId: collectionId.toString(),
                        nftId: nftId.toString(),
                      },
                      pricing:
                        'priceId' in pricingInfo
                          ? {
                              valuationMethod: 'oracle' as any,
                              // If the max borrow quantity is larger than 10k, this is assumed to be "limitless"
                              // TODO: replace by Option once data structure on chain changes
                              maxBorrowAmount:
                                'noLimit' in pricingInfo.maxBorrowAmount
                                  ? null
                                  : new CurrencyBalance(pricingInfo.maxBorrowAmount.quantity, 18),
                              maturityDate:
                                !('none' in info.schedule.maturity) && info.schedule.maturity.fixed.date
                                  ? new Date(info.schedule.maturity.fixed.date * 1000).toISOString()
                                  : null,
                              maturityExtensionDays:
                                !('none' in info.schedule.maturity) && info.schedule.maturity.fixed.extension
                                  ? info.schedule.maturity.fixed.extension / SEC_PER_DAY
                                  : null,
                              priceId: pricingInfo.priceId,
                              oracle: oraclePrices[
                                'isin' in pricingInfo.priceId
                                  ? pricingInfo.priceId?.isin
                                  : pricingInfo.priceId?.poolLoanId.join('-')
                              ] || [
                                {
                                  value: new CurrencyBalance(0, 18),
                                  timestamp: 0,
                                  account: '',
                                },
                              ],
                              outstandingQuantity:
                                'external' in info.pricing && 'outstandingQuantity' in info.pricing.external
                                  ? new CurrencyBalance(info.pricing.external.outstandingQuantity, 18)
                                  : new CurrencyBalance(0, 18),
                              interestRate: new Rate(interestRate),
                              notional: new CurrencyBalance(pricingInfo.notional, currency.decimals),
                              maxPriceVariation: new Rate(pricingInfo.maxPriceVariation),
                              withLinearPricing: pricingInfo.withLinearPricing,
                            }
                          : {
                              valuationMethod:
                                'outstandingDebt' in pricingInfo.valuationMethod ||
                                'cash' in pricingInfo.valuationMethod
                                  ? Object.keys(pricingInfo.valuationMethod)[0]
                                  : ('discountedCashFlow' as any),
                              maxBorrowAmount: Object.keys(pricingInfo.maxBorrowAmount)[0] as any,
                              value: new CurrencyBalance(pricingInfo.collateralValue, currency.decimals),
                              advanceRate: new Rate(Object.values(pricingInfo.maxBorrowAmount)[0].advanceRate),
                              probabilityOfDefault: discount?.probabilityOfDefault
                                ? new Rate(discount.probabilityOfDefault)
                                : undefined,
                              lossGivenDefault: discount?.lossGivenDefault
                                ? new Rate(discount.lossGivenDefault)
                                : undefined,
                              discountRate: discount?.discountRate
                                ? new Rate(discount.discountRate.fixed.ratePerYear)
                                : undefined,
                              interestRate: new Rate(interestRate),
                              maturityDate:
                                !('none' in info.schedule.maturity) && info.schedule.maturity.fixed.date
                                  ? new Date(info.schedule.maturity.fixed.date * 1000).toISOString()
                                  : null,
                              maturityExtensionDays:
                                !('none' in info.schedule.maturity) && info.schedule.maturity.fixed.extension
                                  ? info.schedule.maturity.fixed.extension / SEC_PER_DAY
                                  : null,
                            },
                    }
                  }

                  // Process created loans
                  const createdLoans: CreatedLoan[] = (createdLoanValues as any[]).map(([key, value]) => {
                    const loan = value.toPrimitive() as CreatedLoanData
                    const nil = new CurrencyBalance(0, currency.decimals)
                    return {
                      ...getSharedLoanInfo(loan),
                      id: formatLoanKey(key as StorageKey<[u32, u32]>),
                      poolId,
                      status: 'Created',
                      borrower: addressToHex(loan.borrower),
                      totalBorrowed: nil,
                      totalRepaid: nil,
                      outstandingDebt: nil,
                      normalizedDebt: nil,
                    }
                  })

                  // Process active loans
                  const activeLoans: ActiveLoan[] = (activeLoanValues.toPrimitive() as any[]).map(
                    ([loanId, loan]: [number, ActiveLoanData]) => {
                      const sharedInfo = getSharedLoanInfo(loan)
                      const portfolio = activeLoansPortfolio[loanId.toString()]
                      const penaltyRate =
                        'external' in loan.pricing
                          ? loan.pricing.external.interest.penalty
                          : loan.pricing.internal.interest.penalty
                      const normalizedDebt =
                        'external' in loan.pricing
                          ? loan.pricing.external.interest.normalizedAcc
                          : loan.pricing.internal.interest.normalizedAcc

                      const writeOffStatus = {
                        penaltyInterestRate: new Rate(penaltyRate),
                        percentage: new Rate(loan.writeOffPercentage),
                      }

                      const repaidPrincipal = new CurrencyBalance(loan.totalRepaid.principal, currency.decimals)
                      const repaidInterest = new CurrencyBalance(loan.totalRepaid.interest, currency.decimals)
                      const repaidUnscheduled = new CurrencyBalance(loan.totalRepaid.unscheduled, currency.decimals)
                      const outstandingDebt = new CurrencyBalance(
                        portfolio.outstandingInterest.add(portfolio.outstandingPrincipal),
                        currency.decimals
                      )

                      return {
                        ...sharedInfo,
                        id: loanId.toString(),
                        poolId,
                        status: 'Active',
                        borrower: addressToHex(loan.borrower),
                        writeOffStatus: writeOffStatus.percentage.isZero() ? undefined : writeOffStatus,
                        totalBorrowed: new CurrencyBalance(loan.totalBorrowed, currency.decimals),
                        totalRepaid: new CurrencyBalance(
                          repaidPrincipal.add(repaidInterest).add(repaidUnscheduled),
                          currency.decimals
                        ),
                        repaid: {
                          principal: repaidPrincipal,
                          interest: repaidInterest,
                          unscheduled: repaidUnscheduled,
                        },
                        originationDate: new Date(loan.originationDate * 1000).toISOString(),
                        outstandingDebt,
                        normalizedDebt: new CurrencyBalance(normalizedDebt, currency.decimals),
                        outstandingPrincipal: portfolio.outstandingPrincipal,
                        outstandingInterest: portfolio.outstandingInterest,
                        presentValue: portfolio.presentValue,
                        currentPrice: portfolio.currentPrice,
                      }
                    }
                  )

                  // Process closed loans
                  const closedLoans: ClosedLoan[] = (closedLoanValues as any[]).map(([key, value]) => {
                    const loan = value.toPrimitive() as ClosedLoanData

                    const repaidPrincipal = new CurrencyBalance(loan.totalRepaid.principal, currency.decimals)
                    const repaidInterest = new CurrencyBalance(loan.totalRepaid.interest, currency.decimals)
                    const repaidUnscheduled = new CurrencyBalance(loan.totalRepaid.unscheduled, currency.decimals)

                    return {
                      ...getSharedLoanInfo(loan),
                      id: formatLoanKey(key as StorageKey<[u32, u32]>),
                      poolId,
                      status: 'Closed',
                      totalBorrowed: new CurrencyBalance(loan.totalBorrowed, currency.decimals),
                      totalRepaid: new CurrencyBalance(
                        repaidPrincipal.add(repaidInterest).add(repaidUnscheduled),
                        currency.decimals
                      ),
                      repaid: {
                        principal: repaidPrincipal,
                        interest: repaidInterest,
                        unscheduled: repaidUnscheduled,
                      },
                    }
                  })

                  // Combine all loans
                  return [...createdLoans, ...activeLoans, ...closedLoans] as Loan[]
                })
              )
            })
          )
        })

        return combineLatest(poolObservables).pipe(map((loansPerPool) => loansPerPool.flat()))
      }),
      repeatWhen(() => $events)
    )
  }

  function getWriteOffPolicy(args: [poolId: string]) {
    const [poolId] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => api.query.loans.writeOffPolicy(poolId)),
      map((writeOffGroupsValues) => {
        const writeOffGroups = writeOffGroupsValues.toJSON() as {
          triggers: ({ principalOverdue: number } | { priceOutdated: number })[]
          status: {
            percentage: string
            penalty: string
          }
        }[]
        return writeOffGroups
          .map((g) => {
            return {
              overdueDays: (g.triggers.find((t) => 'principalOverdue' in t) as { principalOverdue: number })
                ?.principalOverdue,
              penaltyInterestRate: new Rate(hexToBN(g.status.penalty)),
              percentage: new Rate(hexToBN(g.status.percentage)),
            }
          })
          .filter((g) => g.overdueDays != null)
      })
    )
  }

  /**
   * @deprecated
   */
  function getPendingCollect(args: [address: Account, poolId: string, trancheId: string, executedEpoch: number]) {
    const [address, poolId, trancheId, executedEpoch] = args
    const $api = inst.getApi()

    return $api.pipe(
      combineLatestWith(getOrder([address, poolId, trancheId])),
      switchMap(([api, order]) => {
        const { currency } = order

        if (
          order.submittedAt < executedEpoch &&
          order.submittedAt >= 0 &&
          (!order.invest.isZero() || !order.redeem.isZero())
        ) {
          const epochKeys = Array.from({ length: executedEpoch - order.submittedAt }, (_, i) => [
            [poolId, trancheId],
            order.submittedAt + i,
          ])
          const $epochs = combineLatest([
            api.query.investments.clearedInvestOrders.multi(epochKeys),
            api.query.investments.clearedRedeemOrders.multi(epochKeys),
          ])

          return $epochs.pipe(
            map(([clearedInvest, clearedRedeem]) => {
              let payoutCurrencyAmount = new BN(0)
              let payoutTokenAmount = new BN(0)
              let remainingInvestCurrency = new BN(order.invest)
              let remainingRedeemToken = new BN(order.redeem)

              for (let i = 0; i < clearedInvest.length; i++) {
                const investEpoch = clearedInvest[i]
                const redeemEpoch = clearedRedeem[i]
                if (remainingInvestCurrency.isZero() && remainingRedeemToken.isZero()) break

                let { ofAmount: investFulfillment } = investEpoch.toJSON() as any
                let { ofAmount: redeemFulfillment, price: tokenPrice } = redeemEpoch.toJSON() as any

                investFulfillment = hexToBN(investFulfillment)
                redeemFulfillment = hexToBN(redeemFulfillment)
                tokenPrice = hexToBN(tokenPrice)

                if (!remainingInvestCurrency.isZero()) {
                  // Multiply invest fulfillment in this epoch with outstanding order amount to get executed amount
                  const amount = remainingInvestCurrency.mul(investFulfillment).div(PerquintillBN)
                  // Divide by the token price to get the payout in tokens
                  if (!amount.isZero()) {
                    payoutTokenAmount = payoutTokenAmount.add(amount.mul(PriceBN).div(tokenPrice))
                    remainingInvestCurrency = remainingInvestCurrency.sub(amount)
                  }
                }

                if (!remainingRedeemToken.isZero()) {
                  // Multiply redeem fulfilment in this epoch with outstanding order amount to get executed amount
                  const amount = remainingRedeemToken.mul(redeemFulfillment).div(PerquintillBN)
                  // Multiply by the token price to get the payout in currency
                  if (!amount.isZero()) {
                    payoutCurrencyAmount = payoutCurrencyAmount.add(amount.mul(tokenPrice).div(PriceBN))
                    remainingRedeemToken = remainingRedeemToken.sub(amount)
                  }
                }
              }

              return {
                investCurrency: new CurrencyBalance(order.invest, currency.decimals),
                redeemToken: new TokenBalance(order.redeem, currency.decimals),
                submittedAt: order.submittedAt,
                payoutCurrencyAmount: new CurrencyBalance(payoutCurrencyAmount, currency.decimals),
                payoutTokenAmount: new TokenBalance(payoutTokenAmount, currency.decimals),
                remainingInvestCurrency: new CurrencyBalance(remainingInvestCurrency, currency.decimals),
                remainingRedeemToken: new TokenBalance(remainingRedeemToken, currency.decimals),
              }
            })
          )
        }
        return of({
          investCurrency: new CurrencyBalance(order.invest, currency.decimals),
          redeemToken: new TokenBalance(order.redeem, currency.decimals),
          submittedAt: order.submittedAt,
          payoutCurrencyAmount: new CurrencyBalance(0, currency.decimals),
          payoutTokenAmount: new TokenBalance(0, currency.decimals),
          remainingInvestCurrency: new CurrencyBalance(order.invest, currency.decimals),
          remainingRedeemToken: new TokenBalance(order.redeem, currency.decimals),
        })
      })
    )
  }

  function getProposedPoolSystemChanges(args: [poolId: string]) {
    const [poolId] = args
    const $api = inst.getApi()

    const $events = inst.getEvents().pipe(
      filter(({ api, events }) => {
        const event = events.find(
          ({ event }) => api.events.poolSystem.ProposedChange.is(event) || api.events.poolFees.Added.is(event)
        )

        if (!event) return false

        const { poolId: eventPoolId } = (event.toHuman() as any).event.data
        return eventPoolId.replace(/\D/g, '') === poolId
      })
    )

    return $api.pipe(
      switchMap((api) => api.query.poolSystem.notedChange.entries(poolId)),
      map((changes) => {
        return changes.map(([key, value]) => {
          const hash = (key.toHuman() as any)[1] as string
          const data = value.toPrimitive() as { change: any; submittedTime: number }
          return {
            hash,
            submittedAt: new Date(data.submittedTime * 1000).toISOString(),
            change: data.change,
          }
        })
      }),
      repeatWhen(() => $events)
    )
  }

  function updateWriteOffPolicy(
    args: [poolId: string, writeOffGroups: { percentage: BN; overdueDays: number; penaltyInterestRate: BN }[]],
    options?: TransactionOptions
  ) {
    const [poolId, writeOffGroups] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.loans.proposeWriteOffPolicy(
          poolId,
          writeOffGroups.map((g) => ({
            triggers: [{ PrincipalOverdue: g.overdueDays }],
            status: {
              percentage: g.percentage.toString(),
              penalty: g.penaltyInterestRate.toString(),
            },
          }))
        )
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function applyWriteOffPolicyUpdate(args: [poolId: string, hash: string], options?: TransactionOptions) {
    const [poolId, hash] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.loans.applyWriteOffPolicy(poolId, hash)
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function getProposedPoolChanges(args: [poolId: string]) {
    const [poolId] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => api.query.poolSystem.scheduledUpdate(poolId)),
      map((updateData) => {
        const update = updateData.toPrimitive() as any
        if (!update?.changes) return null
        const { changes, submittedAt } = update

        return {
          changes: {
            tranches: changes.tranches.noChange === null ? null : changes.tranches.newValue,
            trancheMetadata: changes.trancheMetadata.noChange === null ? null : changes.trancheMetadata.newValue,
            minEpochTime: changes.minEpochTime.noChange === null ? null : changes.minEpochTime.newValue,
            maxNavAge: changes.maxNavAge.noChange === null ? null : changes.maxNavAge.newValue,
          },
          submittedAt: new Date(submittedAt * 1000).toISOString(),
        }
      })
    )
  }

  function applyPoolUpdate(args: [poolId: string], options?: TransactionOptions) {
    const [poolId] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.poolRegistry.executeUpdate(poolId)
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function chargePoolFee(
    args: [feeId: string, amount: CurrencyBalance, pendingFee?: CurrencyBalance],
    options?: TransactionOptions
  ) {
    const [feeId, amount, pendingFee] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        let submittable: SubmittableExtrinsic<'rxjs', ISubmittableResult>
        if (pendingFee?.gtn(0)) {
          const diff = amount.sub(pendingFee)
          if (diff.ltn(0)) {
            submittable = api.tx.poolFees.unchargeFee(feeId, diff.abs().toString())
          } else {
            submittable = api.tx.poolFees.chargeFee(feeId, diff.toString())
          }
        } else {
          submittable = api.tx.poolFees.chargeFee(feeId, amount.toString())
        }
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function updateFees(
    args: [add: AddFee[], remove: number[], poolId: string, metadata: PoolMetadata],
    options?: TransactionOptions
  ) {
    const [add, remove, poolId, metadata] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => api.query.poolFees.lastFeeId()),
      take(1),
      combineLatestWith($api),
      combineLatestWith(getPoolFees([poolId])),
      switchMap(([[lastFeeId, api], poolFees]) => {
        const removeSubmittables = remove.map((feeId) => api.tx.poolFees.removeFee([feeId]))
        const addSubmittables = add.map(({ poolId, fee }) => {
          return api.tx.poolFees.proposeNewFee(poolId, 'Top', {
            destination: fee.destination,
            editor: { account: fee?.account },
            feeType: { [fee.feeType]: { limit: { [fee.limit]: fee.amount } } },
          })
        })
        const removedFeeIds = new Set(remove)
        const remainingFeeIds = new Set(poolFees.map((fee) => fee.id).filter((id) => !removedFeeIds.has(id)))
        const updatedMetadata = {
          ...metadata,
          pool: {
            ...metadata.pool,
            poolFees: [
              ...(metadata?.pool?.poolFees?.filter((fee) => remainingFeeIds.has(fee.id)) || []),
              ...add.map((metadata, index) => {
                return {
                  id: parseInt(lastFeeId.toHuman() as string, 10) + index + 1,
                  name: metadata.fee.name,
                  feePosition: metadata.fee.feePosition,
                  category: metadata.fee.category,
                }
              }),
            ],
          },
        }
        const $pinnedMetadata = inst.metadata.pinJson(updatedMetadata)
        return combineLatest([$api, $pinnedMetadata]).pipe(
          switchMap(([api, pinnedMetadata]) => {
            const submittables = api.tx.utility.batchAll([
              ...removeSubmittables,
              ...addSubmittables,
              api.tx.poolRegistry.setMetadata(poolId, pinnedMetadata.ipfsHash),
            ])
            return inst.wrapSignAndSend(api, submittables, options)
          })
        )
      })
    )
  }

  function applyNewFee(args: [poolId: string, changeId: string], options?: TransactionOptions) {
    const [poolId, changeId] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.poolFees.applyNewFee(poolId, changeId)
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function getNextPoolFeeId() {
    const $api = inst.getApi()
    return $api.pipe(
      switchMap((api) => combineLatest([api.query.poolFees.lastFeeId()])),
      map((feeId) => parseInt(feeId[0].toHuman() as string, 10) + 1)
    )
  }

  function adminWriteOff(
    args: [poolId: string, loanId: string, writeOffGroupId: number],
    options?: TransactionOptions
  ) {
    const [poolId, loanId, writeOffGroupId] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.loans.adminWriteOff(poolId, loanId, writeOffGroupId)
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  async function getAvailablePoolId() {
    const $api = inst.getApi()

    try {
      const res = await firstValueFrom(
        $api.pipe(
          map((api) => ({
            api,
            id: null,
            triesLeft: MAX_ATTEMPTS,
          })),
          expand(({ api, triesLeft }) => {
            const id = String(getRandomUint())
            if (triesLeft <= 0) return EMPTY

            return api.query.poolSystem.pool(id).pipe(
              map((res) => ({ api, id: res.toJSON() === null ? id : null, triesLeft: triesLeft - 1 })),
              take(1)
            )
          }),
          filter(({ id }) => !!id)
        )
      )

      return res.id as string
    } catch (e) {
      throw new Error(`Could not find an available pool ID in ${MAX_ATTEMPTS} attempts`)
    }
  }

  return {
    chargePoolFee,
    updateFees,
    applyNewFee,
    getNextPoolFeeId,
    getPoolCurrency,
    createPool,
    updatePool,
    setMaxReserve,
    setMetadata,
    updateInvestOrder,
    updateRedeemOrder,
    collect,
    closeEpoch,
    executeEpoch,
    submitSolution,
    getUserPermissions,
    getPoolPermissions,
    updatePoolRoles,
    getNextLoanId,
    createLoan,
    withdraw,
    financeLoan,
    financeExternalLoan,
    repayLoanPartially,
    repayExternalLoanPartially,
    repayAndCloseLoan,
    closeLoan,
    transferLoanDebt,
    getPools,
    getBalances,
    getOrder,
    getPoolOrders,
    getPoolOrdersById,
    getPoolAccountOrders,
    getPortfolio,
    getLoans,
    getPoolFees,
    getPendingCollect,
    getWriteOffPolicy,
    getProposedPoolSystemChanges,
    getProposedPoolChanges,
    updateWriteOffPolicy,
    applyWriteOffPolicyUpdate,
    applyPoolUpdate,
    adminWriteOff,
    getAvailablePoolId,
    getDailyPoolStates,
    getPoolStatesByGroup,
    getAggregatedPoolStatesByGroup,
    getAggregatedPoolFeeStatesByGroup,
    getPoolFeeStatesByGroup,
    getInvestorTransactions,
    getAssetTransactions,
    getFeeTransactions,
    getOracleTransactions,
    getAssetSnapshots,
    getNativeCurrency,
    getCurrencies,
    getDailyTrancheStates,
    getTransactionsByAddress,
    getDailyTVL,
    getInvestors,
    getAllPoolAssetSnapshots,
  }
}

export function hexToBN(value?: string | number | null) {
  if (typeof value === 'number' || value == null) return new BN(value ?? 0)
  return new BN(value.toString().substring(2), 'hex')
}

function getEpochStatus(epochExecution: Pick<EpochExecutionData, 'challengePeriodEnd' | 'epoch'>, blockNumber: number) {
  if (!!epochExecution && !epochExecution?.challengePeriodEnd) {
    return 'submissionPeriod'
  } else if (epochExecution?.challengePeriodEnd >= blockNumber) {
    return 'challengePeriod'
  } else if (epochExecution?.challengePeriodEnd < blockNumber) {
    return 'executionPeriod'
  }
  return 'ongoing'
}

export function findCurrency<T extends Pick<CurrencyMetadata, 'key'>>(
  currencies: T[],
  key: CurrencyKey
): T | undefined {
  return currencies.find((currency) => looksLike(currency.key, key))
}

export function findBalance<T extends Pick<AccountCurrencyBalance, 'currency'>>(
  balances: T[],
  key: CurrencyKey
): T | undefined {
  return balances.find((balance) => looksLike(balance.currency.key, key))
}

type RawCurrencyKey = CurrencyKey | { foreignAsset: number | string } | { localAsset: number | string }
export function parseCurrencyKey(key: RawCurrencyKey): CurrencyKey {
  if (typeof key === 'object') {
    if ('Tranche' in key) {
      return {
        Tranche: [key.Tranche[0].replace(/\D/g, ''), key.Tranche[1]],
      }
    } else if ('ForeignAsset' in key) {
      return {
        ForeignAsset: String(key.ForeignAsset).replace(/\D/g, ''),
      }
    } else if ('foreignAsset' in key) {
      return {
        ForeignAsset: String(key.foreignAsset).replace(/\D/g, ''),
      }
    } else if ('LocalAsset' in key) {
      return {
        LocalAsset: String(key.LocalAsset).replace(/\D/g, ''),
      }
    } else if ('localAsset' in key) {
      return {
        LocalAsset: String(key.localAsset).replace(/\D/g, ''),
      }
    }
  }
  return key
}

export function isSameCurrency(a: CurrencyKey, b: CurrencyKey) {
  return looksLike(parseCurrencyKey(a), parseCurrencyKey(b))
}

function looksLike(a: any, b: any): boolean {
  return isPrimitive(b)
    ? b === a
    : Object.keys(b).every((bKey) => {
        const bVal = b[bKey]
        const aVal = a?.[bKey]
        if (typeof bVal === 'function') {
          return bVal(aVal)
        }
        return looksLike(aVal, bVal)
      })
}

function isPrimitive(val: any): val is boolean | string | number | null | undefined {
  return val == null || /^[sbn]/.test(typeof val)
}

export function getCurrencyLocation(currency: CurrencyMetadata) {
  const chainId = (currency.location?.v3 || currency.location?.v4)?.interior?.x3?.[1]?.globalConsensus?.ethereum
    ?.chainId
  if (chainId) {
    return { evm: Number(chainId) }
  }
  const parachain = (currency.location?.v3 || currency.location?.v4)?.interior?.x3?.[0]?.parachain
  if (parachain) {
    return { parachain: Number(parachain) }
  }
  return 'centrifuge'
}

export function getCurrencyEvmAddress(currency: CurrencyMetadata) {
  return (currency.location?.v3 || currency.location?.v4)?.interior?.x3?.[2]?.accountKey20?.key as string | undefined
}

function getCurrency(api: ApiRx, currencyKey: RawCurrencyKey) {
  const curKey = parseCurrencyKey(currencyKey)
  return api.query.ormlAssetRegistry.metadata(curKey).pipe(
    map((rawCurrencyMeta) => {
      const value = rawCurrencyMeta.toPrimitive() as AssetCurrencyData
      const currency: CurrencyMetadata = {
        key: curKey,
        decimals: value.decimals,
        name: value.name,
        symbol: value.symbol,
        isPoolCurrency: value.additional.poolCurrency,
        isPermissioned: value.additional.permissioned,
        additional: value.additional,
        location: value.location,
        displayName: value.symbol.includes('USDC') ? 'USDC' : value.symbol.includes('FRAX') ? 'FRAX' : value.symbol,
      }
      return currency
    }),
    take(1)
  )
}

type GroupBy = 'day' | 'month' | 'quarter' | 'year'
function getGroupByPeriod(date: Date, groupBy: GroupBy) {
  if (groupBy === 'day') {
    return date.toISOString().split('T')[0]
  } else if (groupBy === 'month') {
    return `${date.getMonth() + 1}-${date.getFullYear()}`
  } else if (groupBy === 'quarter') {
    const quarter = Math.ceil((date.getMonth() + 1) / 3)
    return `Q${quarter}-${date.getFullYear()}`
  } else if (groupBy === 'year') {
    return `${date.getFullYear()}`
  }
  throw new Error(`Unsupported groupBy: ${groupBy}`)
}
