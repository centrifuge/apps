import { StorageKey, u32 } from '@polkadot/types'
import { Codec } from '@polkadot/types-codec/types'
import BN from 'bn.js'
import { combineLatest, EMPTY, expand, firstValueFrom, from, Observable, of, startWith } from 'rxjs'
import { combineLatestWith, filter, map, repeatWhen, switchMap, take } from 'rxjs/operators'
import { calculateOptimalSolution, SolverResult } from '..'
import { Centrifuge } from '../Centrifuge'
import { Account, TransactionOptions } from '../types'
import {
  BorrowerTransactionType,
  InvestorTransactionType,
  SubqueryBorrowerTransaction,
  SubqueryInvestorTransaction,
  SubqueryPoolSnapshot,
  SubqueryTrancheSnapshot,
} from '../types/subquery'
import {
  addressToHex,
  computeTrancheId,
  getDateMonthsFromNow,
  getDateYearsFromNow,
  getRandomUint,
  isSameAddress,
} from '../utils'
import { CurrencyBalance, Perquintill, Price, Rate, TokenBalance } from '../utils/BN'
import { Dec } from '../utils/Decimal'

const PerquintillBN = new BN(10).pow(new BN(18))
const PriceBN = new BN(10).pow(new BN(27))
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

export type PoolRoleInput = AdminRole | { TrancheInvestor: [trancheId: string, permissionedTill: number] }

export type CurrencyKey = string | { ForeignAsset: number } | { Tranche: [string, string] }

export type CurrencyMetadata = {
  key: CurrencyKey
  decimals: number
  name: string
  symbol: string
  isPoolCurrency: boolean
  isPermissioned: boolean
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
type LoanInfoInput =
  | {
      valuationMethod: 'outstandingDebt'
      maxBorrowAmount: 'upToTotalBorrowed' | 'upToOutstandingDebt'
      value: BN
      maturityDate: Date
      maturityExtensionDays: number
      advanceRate: BN
      interestRate: BN
    }
  | {
      valuationMethod: 'oracle'
      maxBorrowAmount: BN | null
      Isin: string
      maturityDate: Date
      maturityExtensionDays: number
      interestRate: BN
      notional: BN
    }
  | {
      valuationMethod: 'discountedCashFlow'
      probabilityOfDefault: BN
      lossGivenDefault: BN
      discountRate: BN
      maxBorrowAmount: 'upToTotalBorrowed' | 'upToOutstandingDebt'
      value: BN
      maturityDate: Date
      maturityExtensionDays: number
      advanceRate: BN
      interestRate: BN
    }

export type LoanInfoData = {
  /// Specify the repayments schedule of the loan
  schedule: {
    maturity: { fixed: { date: number; extension: number } }
    interestPayments: 'None'
    payDownSchedule: 'None'
  }

  /// Collateral used for this loan
  collateral: [string, string]

  /// Interest rate per second with any penalty applied
  interestRate: { fixed: { ratePerYear: string; compounding: 'Secondly' } }

  pricing:
    | {
        external: {
          priceId: {
            isin: string
          }
          maxBorrowAmount: { noLimit: null } | { quantity: string }
          notional: string
        }
      }
    | {
        internal: {
          /// Valuation method of this loan
          valuationMethod:
            | { outstandingDebt: null }
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
    maturity: { fixed: { date: number; extension: number } }
    interestPayments: 'None'
    payDownSchedule: 'None'
  }

  /// Collateral used for this loan
  collateral: [string, string]

  pricing:
    | {
        external: {
          info: {
            priceId: {
              isin: string
            }
            maxBorrowAmount: { noLimit: null } | { quantity: string }
            notional: string
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
    latest: CurrencyBalance
    lastUpdated: string
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

type InterestAccrual = {
  interestRatePerSec: string
  accumulatedRate: string
  referenceCount: number
}

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
  totalRepaid: string
}

export type PricingInfo = InternalPricingInfo | ExternalPricingInfo

export type InternalPricingInfo = {
  valuationMethod: 'discountedCashFlow' | 'outstandingDebt'
  maxBorrowAmount: 'upToTotalBorrowed' | 'upToOutstandingDebt'
  value: CurrencyBalance
  maturityDate: string
  maturityExtensionDays: number
  advanceRate: Rate
  interestRate: Rate
  probabilityOfDefault?: Rate
  lossGivenDefault?: Rate
  discountRate?: Rate
}

export type ExternalPricingInfo = {
  valuationMethod: 'oracle'
  maxBorrowAmount: CurrencyBalance | null
  outstandingQuantity: CurrencyBalance
  Isin: string
  maturityDate: string
  maturityExtensionDays: number
  oracle: {
    value: CurrencyBalance
    timestamp: number
  }
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
  writeOffPercentage: string
}

// transformed type for UI
export type CreatedLoan = {
  status: 'Created'
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
}

// transformed type for UI
export type ClosedLoan = {
  status: 'Closed'
  id: string
  poolId: string
  pricing: PricingInfo
  asset: {
    collectionId: string
    nftId: string
  }
  totalBorrowed: CurrencyBalance
  totalRepaid: CurrencyBalance
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

export type TrancheInput = {
  interestRatePerSec?: BN
  minRiskBuffer?: BN
  tokenName?: string
  tokenSymbol?: string
}

export type DailyTrancheState = {
  id: string
  price: null | Price
  fulfilledInvestOrders: CurrencyBalance
  fulfilledRedeemOrders: CurrencyBalance
  outstandingInvestOrders: CurrencyBalance
  outstandingRedeemOrders: CurrencyBalance
}

export type DailyPoolState = {
  poolState: {
    portfolioValuation: CurrencyBalance
    totalReserve: CurrencyBalance
  }
  poolValue: CurrencyBalance
  currency: string
  timestamp: string
  tranches: { [trancheId: string]: DailyTrancheState }

  sumBorrowedAmountByPeriod: number | null
  sumRepaidAmountByPeriod: number | null
  sumInvestedAmountByPeriod: number | null
  sumRedeemedAmountByPeriod: number | null
  blockNumber: number
}

interface TrancheFormValues {
  tokenName: string
  symbolName: string
  interestRate: number | ''
  minRiskBuffer: number | ''
  minInvestment: number | ''
}

export type IssuerDetail = {
  title: string
  body: string
}

type FileType = { uri: string; mime: string }

export interface PoolMetadataInput {
  // details
  poolIcon: FileType | null
  poolName: string
  assetClass: string
  currency: string
  maxReserve: number | ''
  epochHours: number | ''
  epochMinutes: number | ''
  podEndpoint: string
  listed?: boolean

  // issuer
  issuerName: string
  issuerRepName: string
  issuerLogo?: FileType | null
  issuerDescription: string

  executiveSummary: FileType | null
  website: string
  forum: string
  email: string
  details?: IssuerDetail[]

  // tranche
  tranches: TrancheFormValues[]

  adminMultisig?: {
    signers: string[]
    threshold: number
  }
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
      class: string
    }
    newInvestmentsStatus?: Record<string, 'closed' | 'request' | 'open'>
    issuer: {
      repName: string
      name: string
      description: string
      email: string
      logo?: FileType | null
    }
    links: {
      executiveSummary: FileType | null
      forum?: string
      website?: string
    }
    details?: IssuerDetail[]
    status: PoolStatus
    listed: boolean
  }
  pod?: {
    node: string | null
    indexer?: string | null
  }
  tranches: Record<
    string,
    {
      icon?: FileType | null
      minInitialInvestment?: string
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
  timestamp: string
  accountId: string
  trancheId: string
  epochNumber: number
  type: InvestorTransactionType
  currencyAmount: CurrencyBalance | undefined
  tokenAmount: CurrencyBalance | undefined
  tokenPrice: Price | undefined
  transactionFee: CurrencyBalance | null
}

type BorrowerTransaction = {
  id: string
  timestamp: string
  poolId: string
  accountId: string
  epochId: string
  loanId: string
  type: BorrowerTransactionType
  amount: CurrencyBalance | undefined
}

const formatPoolKey = (keys: StorageKey<[u32]>) => (keys.toHuman() as string[])[0].replace(/\D/g, '')
const formatLoanKey = (keys: StorageKey<[u32, u32]>) => (keys.toHuman() as string[])[1].replace(/\D/g, '')

const MAX_ATTEMPTS = 10

export function getPoolsModule(inst: Centrifuge) {
  function createPool(
    args: [
      admin: string,
      poolId: string,
      collectionId: string,
      tranches: TrancheInput[],
      currency: CurrencyKey,
      maxReserve: BN,
      metadata: PoolMetadataInput
    ],
    options?: TransactionOptions
  ) {
    const [admin, poolId, , tranches, currency, maxReserve, metadata] = args
    const trancheInput = tranches.map((t, i) => ({
      trancheType: t.interestRatePerSec
        ? {
            NonResidual: {
              interestRatePerSec: t.interestRatePerSec.toString(),
              minRiskBuffer: t.minRiskBuffer?.toString(),
            },
          }
        : 'Residual',
      metadata: {
        tokenName: `${metadata.poolName} ${metadata.tranches[i].tokenName}`,
        tokenSymbol: metadata.tranches[i].symbolName,
      },
    }))

    return inst.getApi().pipe(
      switchMap((api) =>
        api.query.ormlAssetRegistry.metadata(currency).pipe(
          take(1),
          switchMap((rawCurrencyMeta) => {
            const currencyMeta = rawCurrencyMeta.toHuman() as AssetCurrencyData
            return pinPoolMetadata(metadata, poolId, currencyMeta.decimals, options)
          }),
          switchMap((pinnedMetadata) => {
            const tx = api.tx.poolRegistry.register(
              admin,
              poolId,
              trancheInput,
              currency,
              maxReserve.toString(),
              pinnedMetadata.ipfsHash
            )
            if (options?.createType === 'propose') {
              const proposalTx = api.tx.utility.batchAll([
                api.tx.preimage.notePreimage(tx.method.toHex()),
                api.tx.democracy.propose({ Inline: tx.method.hash }, api.consts.democracy.minimumDeposit),
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
      }
    })

    const formattedMetadata: PoolMetadata = {
      version: 1,
      pool: {
        name: metadata.poolName,
        icon: metadata.poolIcon,
        asset: { class: metadata.assetClass },
        issuer: {
          name: metadata.issuerName,
          repName: metadata.issuerRepName,
          description: metadata.issuerDescription,
          email: metadata.email,
          logo: metadata.issuerLogo,
        },
        links: {
          executiveSummary: metadata.executiveSummary,
          forum: metadata.forum,
          website: metadata.website,
        },
        details: metadata.details,
        status: 'open',
        listed: metadata.listed ?? true,
      },
      pod: {
        node: metadata.podEndpoint ?? null,
      },
      tranches: tranchesById,
      adminMultisig: metadata.adminMultisig,
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
          ...add.map(([addr, role]) =>
            api.tx.permissions.add(
              { PoolRole: typeof role === 'string' ? 'PoolAdmin' : 'InvestorAdmin' },
              addr,
              { Pool: poolId },
              { PoolRole: role }
            )
          ),
          ...sortedRemove.map(([addr, role]) =>
            api.tx.permissions.remove(
              { PoolRole: typeof role === 'string' ? 'PoolAdmin' : 'InvestorAdmin' },
              addr,
              { Pool: poolId },
              { PoolRole: role }
            )
          ),
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

        let submittable
        const redeemTx = api.tx.investments.updateRedeemOrder([poolId, trancheId], newOrder.toString())

        let unstakeTx
        if (!stake.isZero()) {
          const unstakeAmount = newOrder.gte(stake) ? stake : newOrder
          unstakeTx = api.tx.liquidityRewards.unstake({ Tranche: [poolId, trancheId] }, unstakeAmount)
        }

        if ((!order.invest.isZero() || !order.redeem.isZero()) && order.submittedAt !== orderId) {
          const collectTx = !order.invest.isZero()
            ? api.tx.investments.collectInvestments([poolId, trancheId])
            : api.tx.investments.collectRedemptions([poolId, trancheId])

          submittable = api.tx.utility.batchAll([unstakeTx, collectTx, redeemTx].filter(Boolean))
        } else {
          submittable = unstakeTx ? api.tx.utility.batchAll([unstakeTx, redeemTx]) : redeemTx
        }

        return inst.wrapSignAndSend(api, submittable, options)
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
    const $pool = getPool([poolId]).pipe(take(1))
    const $poolOrders = getPoolOrders([poolId]).pipe(take(1))
    const $api = inst.getApi()
    return combineLatest([$pool, $poolOrders]).pipe(
      switchMap(([pool, poolOrders]) => {
        const solutionTranches = pool.tranches.map((tranche) => ({
          ratio: tranche.ratio,
          minRiskBuffer: tranche.minRiskBuffer,
        }))
        const poolState = {
          netAssetValue: pool.nav.latest,
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

  function getUserPermissions(args: [address: Account]) {
    const [address] = args
    const $api = inst.getApi()

    const $events = inst.getEvents().pipe(
      filter(({ api, events }) => {
        const event = events.find(
          ({ event }) => api.events.permissions.Added.is(event) || api.events.permissions.Removed.is(event)
        )
        if (!event) return false

        const [accountId] = (event.toJSON() as any).event.data
        return isSameAddress(address, accountId)
      })
    )

    return $api.pipe(
      switchMap((api) => api.query.permissions.permission.entries(address)),
      map((permissionsData) => {
        const roles: {
          pools: {
            [poolId: string]: PoolRoles
          }
          currencies: {
            [currency: string]: {
              roles: CurrencyRole[]
              holder: boolean
            }
          }
        } = {
          pools: {},
          currencies: {},
        }

        permissionsData.forEach(([keys, value]) => {
          const key = (keys.toHuman() as any)[1] as { Pool: string } | { Currency: any }
          if ('Pool' in key) {
            const poolId = key.Pool.replace(/\D/g, '')
            const permissions = value.toJSON() as any
            roles.pools[poolId] = {
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
                roles.pools[poolId].tranches[info.trancheId] = new Date(info.permissionedTill * 1000).toISOString()
              })
          }
        })
        return roles
      }),
      repeatWhen(() => $events)
    )
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

  async function getNextLoanId(args: [poolId: string]) {
    const [poolId] = args
    const $api = inst.getApi()

    const id = await firstValueFrom($api.pipe(switchMap((api) => api.query.loans.nextLoanId(poolId))))
    return id
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
        maturity: {
          fixed: {
            date: Math.round(infoInput.maturityDate.getTime() / 1000),
            extension: infoInput.maturityExtensionDays * SEC_PER_DAY,
          },
        },
        interestPayments: 'None',
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
                priceId: {
                  isin: infoInput.Isin,
                },
                maxBorrowAmount:
                  infoInput.maxBorrowAmount === null
                    ? { noLimit: null }
                    : { quantity: infoInput.maxBorrowAmount.toString() },
                notional: infoInput.notional.toString(),
              },
            }
          : {
              internal: {
                valuationMethod:
                  infoInput.valuationMethod === 'outstandingDebt'
                    ? { outstandingDebt: null }
                    : {
                        discountedCashFlow: {
                          probabilityOfDefault: infoInput.probabilityOfDefault.toString(),
                          lossGivenDefault: infoInput.lossGivenDefault.toString(),
                          discountRate: {
                            fixed: { ratePerYear: infoInput.discountRate.toString(), compounding: 'Secondly' },
                          },
                        },
                      },
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

  function financeExternalLoan(
    args: [poolId: string, loanId: string, quantity: BN, price: BN, isin: string, aoProxy: string],
    options?: TransactionOptions
  ) {
    const [poolId, loanId, quantity, price, isin, aoProxy] = args
    const $api = inst.getApi()
    return $api.pipe(
      switchMap((api) => {
        const borrowSubmittable = api.tx.proxy.proxy(
          aoProxy,
          undefined,
          api.tx.loans.borrow(poolId, loanId, {
            external: { quantity: quantity.toString(), settlementPrice: price.toString() },
          })
        )
        const oracleFeedSubmittable = api.tx.priceOracle.feedValues([[{ Isin: isin }, price]])
        const batchSubmittable = api.tx.utility.batchAll([oracleFeedSubmittable, borrowSubmittable])
        return inst.wrapSignAndSend(api, batchSubmittable, options)
      })
    )
  }

  function financeLoan(args: [poolId: string, loanId: string, amount: BN], options?: TransactionOptions) {
    const [poolId, loanId, amount] = args
    const $api = inst.getApi()
    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.loans.borrow(poolId, loanId, { internal: amount.toString() })
        return inst.wrapSignAndSend(api, submittable, options)
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
    args: [
      poolId: string,
      loanId: string,
      quantity: BN,
      interest: BN,
      unscheduled: BN,
      price: BN,
      isin: string,
      aoProxy: string
    ],
    options?: TransactionOptions
  ) {
    const [poolId, loanId, quantity, interest, unscheduled, price, isin, aoProxy] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const repaySubmittable = api.tx.proxy.proxy(
          aoProxy,
          undefined,
          api.tx.loans.repay(poolId, loanId, {
            principal: { external: { quantity: quantity.toString(), settlementPrice: price.toString() } },
            interest: interest.toString(),
            unscheduled: unscheduled.toString(),
          })
        )
        const oracleFeedSubmittable = api.tx.priceOracle.feedValues([[{ Isin: isin }, price]])
        const batchSubmittable = api.tx.utility.batchAll([oracleFeedSubmittable, repaySubmittable])
        return inst.wrapSignAndSend(api, batchSubmittable, options)
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
            api.events.investments.RedeemOrderUpdated.is(event)
        )
        return !!event
      })
    )

    const $query = inst.getSubqueryObservable<{ pools: { nodes: { id: string; createdAt: string }[] } }>(
      `query {
          pools {
            nodes {
              id
              createdAt
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
        (api, [rawPools, rawMetadatas, rawNavs, rawEpochExecutions, currencies]) => ({
          api,
          rawPools,
          rawMetadatas,
          rawNavs,
          rawEpochExecutions,
          currencies,
        })
      ),
      switchMap(({ api, rawPools, rawMetadatas, rawNavs, rawEpochExecutions, currencies }) => {
        if (!rawPools.length) return of([])

        const navMap = rawNavs.reduce((acc, [key, navValue]) => {
          const poolId = formatPoolKey(key as StorageKey<[u32]>)
          const nav = navValue.toJSON() as unknown as NAVDetailsData
          acc[poolId] = {
            latest: nav ? nav.value : '0',
            lastUpdated: nav ? nav.lastUpdated : 0,
          }
          return acc
        }, {} as Record<string, { latest: string; lastUpdated: number }>)

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
          // @ts-expect-error
          pools.map((p) => api.rpc.pools.trancheTokenPrices(p.id).pipe(startWith(null))) as Observable<Codec[] | null>[]
        )

        const $block = inst.getBlocks().pipe(take(1))

        return combineLatest([$issuance, $block, $prices]).pipe(
          map(([rawIssuances, { block }, rawPrices]) => {
            const blockNumber = block.header.number.toNumber()

            const mappedPools = pools.map((poolObj, poolIndex) => {
              const { data: pool, id: poolId } = poolObj
              const metadata = metadataMap[poolId]
              const navData = navMap[poolId]
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

              const mappedPool: Pool = {
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
                  const rawPrice = rawPrices[poolIndex]?.[index]
                  const tokenPrice = rawPrice ? new Price(hexToBN(rawPrice.toHex())) : Price.fromFloat(1)

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
                  latest: navData?.latest
                    ? new CurrencyBalance(hexToBN(navData.latest), currency.decimals)
                    : new CurrencyBalance(0, currency.decimals),
                  lastUpdated: new Date((navData?.lastUpdated ?? 0) * 1000).toISOString(),
                },
                value: new CurrencyBalance(
                  hexToBN(pool.reserve.total).add(new BN(navData?.latest ? hexToBN(navData.latest) : 0)),
                  currency.decimals
                ),
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
            const pool = rawPool.toHuman() as any
            return api.query.ormlAssetRegistry.metadata(pool.currency).pipe(
              map((rawCurrencyMeta) => {
                const value = rawCurrencyMeta.toHuman() as AssetCurrencyData
                const currency: CurrencyMetadata = {
                  key: pool.currency,
                  decimals: value.decimals,
                  name: value.name,
                  symbol: value.symbol,
                  isPoolCurrency: value.additional.poolCurrency,
                  isPermissioned: value.additional.permissioned,
                }
                return currency
              })
            )
          }),
          take(1)
        )
      )
    )
  }

  function getDailyPoolStates(args: [poolId: string, from?: Date, to?: Date]) {
    const [poolId, from, to] = args

    const $query = inst.getSubqueryObservable<{
      poolSnapshots: { nodes: SubqueryPoolSnapshot[] }
      trancheSnapshots: { nodes: SubqueryTrancheSnapshot[] }
    }>(
      `query($poolId: String!, $from: Datetime!, $to: Datetime!) {
        poolSnapshots(
          orderBy: BLOCK_NUMBER_ASC,
          filter: {
            id: { startsWith: $poolId },
            timestamp: { greaterThan: $from, lessThan: $to }
          }) {
          nodes {
            id
            timestamp
            totalReserve
            portfolioValuation

            blockNumber
            sumBorrowedAmountByPeriod
            sumRepaidAmountByPeriod
            sumInvestedAmountByPeriod
            sumRedeemedAmountByPeriod
          }
        }
        trancheSnapshots(
          orderBy: BLOCK_NUMBER_ASC,
          filter: {
            id: { startsWith: $poolId },
            timestamp: { greaterThan: $from, lessThan: $to }
          }) {
          nodes {
            id
            trancheId
            timestamp
            tokenSupply
            tokenPrice
            sumOutstandingInvestOrdersByPeriod
            sumOutstandingRedeemOrdersByPeriod
            sumFulfilledInvestOrdersByPeriod
            sumFulfilledRedeemOrdersByPeriod
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

    return combineLatest([$query, getPoolCurrency([poolId])]).pipe(
      switchMap(([queryData, currency]) => {
        return [
          queryData?.poolSnapshots.nodes.map((state) => {
            const poolState = {
              id: state.id,
              portfolioValuation: new CurrencyBalance(state.portfolioValuation, currency.decimals),
              totalReserve: new CurrencyBalance(state.totalReserve, currency.decimals),
            }
            const poolValue = new CurrencyBalance(
              new BN(state?.portfolioValuation || '0').add(new BN(state?.totalReserve || '0')),
              currency.decimals
            )

            // TODO: This is inefficient, would be better to construct a map indexed by the timestamp
            const trancheSnapshotsToday = queryData?.trancheSnapshots.nodes.filter(
              (t) => t.timestamp === state.timestamp
            )

            const tranches: { [trancheId: string]: DailyTrancheState } = {}
            trancheSnapshotsToday.forEach((tranche) => {
              const tid = tranche.trancheId.split('-')[1]
              tranches[tid] = {
                id: tranche.trancheId,
                price: tranche.tokenPrice ? new Price(tranche.tokenPrice) : null,
                fulfilledInvestOrders: new CurrencyBalance(tranche.sumFulfilledInvestOrdersByPeriod, currency.decimals),
                fulfilledRedeemOrders: new CurrencyBalance(tranche.sumFulfilledRedeemOrdersByPeriod, currency.decimals),
                outstandingInvestOrders: new CurrencyBalance(
                  tranche.sumOutstandingInvestOrdersByPeriod,
                  currency.decimals
                ),
                outstandingRedeemOrders: new CurrencyBalance(
                  tranche.sumOutstandingRedeemOrdersByPeriod,
                  currency.decimals
                ),
              }
            })

            return { ...state, poolState, poolValue, tranches }
          }) as unknown as DailyPoolState[],
        ]
      })
    )
  }

  function getDailyTrancheStates(args: [trancheId: string]) {
    const [trancheId] = args
    const $query = inst.getSubqueryObservable<{ trancheSnapshots: { nodes: SubqueryTrancheSnapshot[] } }>(
      `query($trancheId: String!) {
        trancheSnapshots(
          orderBy: BLOCK_NUMBER_ASC,
          filter: {
            trancheId: { includes: $trancheId },
          }) {
          nodes {
            tokenPrice
            blockNumber
            timestamp
            trancheId
            tranche {
              poolId
              trancheId
            }
          }
        }
      }
      `,
      {
        trancheId,
      }
    )
    return $query.pipe(
      map((data) => {
        if (!data) {
          return []
        }
        return data.trancheSnapshots.nodes.map((state) => {
          return {
            ...state,
            tokenPrice: new Price(state.tokenPrice),
          }
        })
      })
    )
  }

  function getMonthlyPoolStates(args: [poolId: string, from?: Date, to?: Date]) {
    return getDailyPoolStates(args).pipe(
      map((poolStates) => {
        if (!poolStates) return []
        // group by month
        // todo: find last of each month
        const poolStatesByMonth: { [monthYear: string]: DailyPoolState[] } = {}
        poolStates.forEach((poolState) => {
          const monthYear = `${new Date(poolState.timestamp).getMonth()}-${new Date(poolState.timestamp).getFullYear()}`
          if (monthYear in poolStatesByMonth) {
            poolStatesByMonth[monthYear] = [...poolStatesByMonth[monthYear], poolState]
          } else {
            poolStatesByMonth[monthYear] = [poolState]
          }
        })

        return Object.values(poolStatesByMonth).map((statesOneMonth) => {
          const base = statesOneMonth[statesOneMonth.length - 1]
          // todo: sum aggregated values (e.g. tranches.fulfilledInvestOrders)

          return base
        })
      })
    )
  }

  function getInvestorTransactions(args: [poolId: string, trancheId?: string, from?: Date, to?: Date]) {
    const [poolId, trancheId, from, to] = args
    const $api = inst.getApi()

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
      }
    )

    return $api.pipe(
      switchMap((api) =>
        combineLatest([$query, api.query.poolSystem.pool(poolId).pipe(take(1)), getCurrencies()]).pipe(
          switchMap(([queryData, poolValue, currencies]) => {
            const pool = poolValue.toHuman() as unknown as PoolDetailsData
            const currency = findCurrency(currencies, pool.currency)!
            const currencyDecimals = currency.decimals

            return [
              queryData?.investorTransactions.nodes.map((tx) => {
                return {
                  id: tx.id,
                  timestamp: new Date(tx.timestamp),
                  accountId: tx.accountId,
                  trancheId: tx.trancheId,
                  epochNumber: tx.epochNumber,
                  type: tx.type as InvestorTransactionType,
                  currencyAmount: tx.currencyAmount
                    ? new CurrencyBalance(tx.currencyAmount, currencyDecimals)
                    : undefined,
                  tokenAmount: tx.tokenAmount ? new CurrencyBalance(tx.tokenAmount, currencyDecimals) : undefined,
                  tokenPrice: tx.tokenPrice ? new Price(tx.tokenPrice) : undefined,
                  transactionFee: tx.transactionFee ? new CurrencyBalance(tx.transactionFee, 18) : undefined, // native tokenks are always denominated in 18
                }
              }) as unknown as InvestorTransaction[],
            ]
          })
        )
      )
    )
  }

  function getBorrowerTransactions(args: [poolId: string, from?: Date, to?: Date]) {
    const [poolId, from, to] = args

    const $query = inst.getSubqueryObservable<{
      borrowerTransactions: { nodes: SubqueryBorrowerTransaction[] }
    }>(
      `query($poolId: String!, $from: Datetime!, $to: Datetime!) {
        borrowerTransactions(
          orderBy: TIMESTAMP_ASC,
          filter: { 
            poolId: { equalTo: $poolId },
            timestamp: { greaterThan: $from, lessThan: $to },
          }) {
          nodes {
            loanId
            epochId
            type
            timestamp
            amount
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
        return data!.borrowerTransactions.nodes.map((tx) => ({
          ...tx,
          amount: tx.amount ? new CurrencyBalance(tx.amount, currency.decimals) : undefined,
          timestamp: new Date(tx.timestamp),
        })) as unknown as BorrowerTransaction[]
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
          const key = parseCurrencyKey((rawKey.toHuman() as any)[0] as CurrencyKey)
          const value = rawValue.toHuman() as AssetCurrencyData
          const currency: CurrencyMetadata = {
            key,
            decimals: value.decimals,
            name: value.name,
            symbol: value.symbol,
            isPoolCurrency: value.additional.poolCurrency,
            isPermissioned: value.additional.permissioned,
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
          getCurrencies(),
        ]).pipe(
          take(1),
          map(([rawBalances, nativeBalance, currencies]) => {
            const balances = {
              tranches: [] as AccountTokenBalance[],
              currencies: [] as AccountCurrencyBalance[],
              native: {
                balance: new CurrencyBalance(
                  (nativeBalance as any).data.free.toString(),
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
              const value = rawValue.toJSON() as { free: string | number }
              const currency = findCurrency(currencies, key)

              if (!currency) return

              if (typeof key !== 'string' && 'Tranche' in key) {
                const [pid, trancheId] = key.Tranche
                const poolId = pid.replace(/\D/g, '')
                if (value.free !== 0) {
                  balances.tranches.push({
                    currency,
                    poolId,
                    trancheId,
                    balance: new TokenBalance(hexToBN(value.free), currency.decimals),
                  })
                }
              } else {
                if (value.free !== 0) {
                  balances.currencies.push({
                    currency,
                    balance: new CurrencyBalance(hexToBN(value.free), currency.decimals),
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

  function getOrder(args: [address: Account, poolId: string, trancheId: string]) {
    const [address, poolId, trancheId] = args

    return inst.getApi().pipe(
      switchMap((api) =>
        combineLatest([
          api.queryMulti([
            [api.query.investments.investOrders, [address, { poolId, trancheId }]],
            [api.query.investments.redeemOrders, [address, { poolId, trancheId }]],
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

  function getPoolOrders(args: [poolId: string]) {
    const [poolId] = args

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
              [api.query.investments.activeInvestOrders, { poolId, trancheId }],
              [api.query.investments.activeRedeemOrders, { poolId, trancheId }],
              [api.query.investments.inProcessingInvestOrders, { poolId, trancheId }],
              [api.query.investments.inProcessingRedeemOrders, { poolId, trancheId }],
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
      })
    )
  }

  function getLoans(args: [poolId: string]) {
    const [poolId] = args
    const $api = inst.getApi()

    const $events = inst.getEvents().pipe(
      filter(({ api, events }) => {
        const event = events.find(
          ({ event }) =>
            api.events.priceOracle.NewFeedData.is(event) ||
            api.events.loans.Created.is(event) ||
            api.events.loans.Borrowed.is(event) ||
            api.events.loans.Repaid.is(event) ||
            api.events.loans.WrittenOff.is(event) ||
            api.events.loans.Closed.is(event) ||
            api.events.loans.PortfolioValuationUpdated.is(event)
        )

        if (!event) return false

        const { poolId: eventPoolId } = (event.toHuman() as any).event.data
        return eventPoolId.replace(/\D/g, '') === poolId
      })
    )

    return $api.pipe(
      switchMap(
        (api) => api.query.poolSystem.pool(poolId).pipe(take(1)),
        (api, poolValue) => ({ api, poolValue })
      ),
      switchMap(({ api, poolValue }) => {
        return combineLatest([
          api.query.loans.createdLoan.entries(poolId),
          api.query.loans.activeLoans(poolId),
          api.query.loans.closedLoan.entries(poolId),
          api.query.priceOracle.values.entries(),
          api.query.interestAccrual.rates(),
          api.query.interestAccrual.lastUpdated(),
          api.query.ormlAssetRegistry.metadata((poolValue.toHuman() as any).currency),
        ]).pipe(take(1))
      }),
      map(
        ([
          createdLoanValues,
          activeLoanValues,
          closedLoanValues,
          oracles,
          rateValues,
          interestLastUpdated,
          rawCurrency,
        ]) => {
          const currency = rawCurrency.toHuman() as AssetCurrencyData
          const rates = rateValues.toPrimitive() as InterestAccrual[]

          const oraclePrices: Record<
            string,
            {
              timestamp: number
              value: CurrencyBalance
            }
          > = {}
          oracles.forEach((oracle) => {
            const { timestamp, value } = oracle[1].toPrimitive() as any
            oraclePrices[(oracle[0].toHuman() as any)[0].Isin] = {
              timestamp,
              value: new CurrencyBalance(value, currency.decimals),
            }
          })

          function getSharedLoanInfo(loan: CreatedLoanData | ActiveLoanData | ClosedLoanData) {
            const info = 'info' in loan ? loan.info : loan
            const [collectionId, nftId] = info.collateral

            // Active loans have additinal info layer
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
                          : new CurrencyBalance(pricingInfo.maxBorrowAmount.quantity, 27),
                      Isin: pricingInfo.priceId.isin,
                      maturityDate: new Date(info.schedule.maturity.fixed.date * 1000).toISOString(),
                      maturityExtensionDays: info.schedule.maturity.fixed.extension / SEC_PER_DAY,
                      oracle: oraclePrices[pricingInfo.priceId.isin] || {
                        value: new CurrencyBalance(0, currency.decimals),
                        timestamp: 0,
                      },
                      outstandingQuantity:
                        'external' in info.pricing && 'outstandingQuantity' in info.pricing.external
                          ? new CurrencyBalance(info.pricing.external.outstandingQuantity, 27) // TODO: Will be 18 after next chain update
                          : new CurrencyBalance(0, 27),
                      interestRate: new Rate(interestRate),
                      notional: new CurrencyBalance(pricingInfo.notional, currency.decimals),
                    }
                  : {
                      valuationMethod: ('outstandingDebt' in pricingInfo.valuationMethod
                        ? 'outstandingDebt'
                        : 'discountedCashFlow') as any,
                      maxBorrowAmount: Object.keys(pricingInfo.maxBorrowAmount)[0] as any,
                      value: new CurrencyBalance(pricingInfo.collateralValue, currency.decimals),
                      advanceRate: new Rate(Object.values(pricingInfo.maxBorrowAmount)[0].advanceRate),
                      probabilityOfDefault: discount?.probabilityOfDefault
                        ? new Rate(discount.probabilityOfDefault)
                        : undefined,
                      lossGivenDefault: discount?.lossGivenDefault ? new Rate(discount.lossGivenDefault) : undefined,
                      discountRate: discount?.discountRate
                        ? new Rate(discount.discountRate.fixed.ratePerYear)
                        : undefined,
                      interestRate: new Rate(interestRate),
                      maturityDate: new Date(info.schedule.maturity.fixed.date * 1000).toISOString(),
                      maturityExtensionDays: info.schedule.maturity.fixed.extension / SEC_PER_DAY,
                    },
            }
          }

          const createdLoans: CreatedLoan[] = (createdLoanValues as any[]).map(([key, value]) => {
            const loan = value.toPrimitive() as unknown as CreatedLoanData
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

          const activeLoans: ActiveLoan[] = (activeLoanValues.toPrimitive() as any[]).map(
            ([loanId, loan]: [number, ActiveLoanData]) => {
              const sharedInfo = getSharedLoanInfo(loan)
              const interestData = rates.find(
                (rate) =>
                  new Rate(rate.interestRatePerSec).toApr().toDecimalPlaces(4).toString() ===
                  sharedInfo.pricing.interestRate.toDecimal().toString()
              )
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
              const outstandingDebt = getOutstandingDebt(
                loan,
                currency.decimals,
                interestLastUpdated.toPrimitive() as number,
                interestData
              )
              let outstandingPrincipal: CurrencyBalance
              let outstandingInterest: CurrencyBalance
              if ('internal' in loan.pricing) {
                outstandingPrincipal = new CurrencyBalance(
                  new BN(loan.totalBorrowed).sub(repaidPrincipal),
                  currency.decimals
                )
                outstandingInterest = new CurrencyBalance(outstandingDebt.sub(outstandingPrincipal), currency.decimals)
              } else {
                const quantity = new CurrencyBalance(loan.pricing.external.outstandingQuantity, 27).toDecimal()
                outstandingPrincipal = CurrencyBalance.fromFloat(
                  quantity.mul(
                    new CurrencyBalance(sharedInfo.pricing.oracle?.value ?? new BN(0), currency.decimals).toDecimal()
                  ),
                  currency.decimals
                )
                outstandingInterest = CurrencyBalance.fromFloat(
                  outstandingDebt
                    .toDecimal()
                    .sub(
                      quantity.mul(
                        new CurrencyBalance(loan.pricing.external.info.notional, currency.decimals).toDecimal()
                      )
                    ),
                  currency.decimals
                )
              }
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
                outstandingPrincipal,
                outstandingInterest,
              }
            }
          )

          const closedLoans: ClosedLoan[] = (closedLoanValues as any[]).map(([key, value]) => {
            const loan = value.toPrimitive() as unknown as ClosedLoanData
            return {
              ...getSharedLoanInfo(loan),
              id: formatLoanKey(key as StorageKey<[u32, u32]>),
              poolId,
              status: 'Closed',
              totalBorrowed: new CurrencyBalance(loan.totalBorrowed, currency.decimals),
              totalRepaid: new CurrencyBalance(loan.totalRepaid, currency.decimals),
            }
          })

          return [...createdLoans, ...activeLoans, ...closedLoans] as Loan[]
        }
      ),
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

  function getProposedLoanChanges(args: [poolId: string]) {
    const [poolId] = args
    const $api = inst.getApi()

    const $events = inst.getEvents().pipe(
      filter(({ api, events }) => {
        const event = events.find(({ event }) => api.events.poolSystem.ProposedChange.is(event))

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
        if (!update) return null
        return {
          changes: {
            tranches: update.tranches.noChange === null ? null : update.tranches.newValue,
            trancheMetadata: update.trancheMetadata.noChange === null ? null : update.trancheMetadata.newValue,
            minEpochTime: update.minEpochTime.noChange === null ? null : update.minEpochTime.newValue,
            maxNavAge: update.maxNavAge.noChange === null ? null : update.maxNavAge.newValue,
          },
          submittedAt: new Date(update.submittedAt * 1000).toISOString(),
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
    financeLoan,
    financeExternalLoan,
    repayLoanPartially,
    repayExternalLoanPartially,
    repayAndCloseLoan,
    closeLoan,
    getPool,
    getPools,
    getBalances,
    getOrder,
    getPoolOrders,
    getLoans,
    getPendingCollect,
    getWriteOffPolicy,
    getProposedLoanChanges,
    getProposedPoolChanges,
    updateWriteOffPolicy,
    applyWriteOffPolicyUpdate,
    applyPoolUpdate,
    adminWriteOff,
    getAvailablePoolId,
    getDailyPoolStates,
    getMonthlyPoolStates,
    getInvestorTransactions,
    getBorrowerTransactions,
    getNativeCurrency,
    getCurrencies,
    getDailyTrancheStates,
  }
}

function hexToBN(value: string | number) {
  if (typeof value === 'number') return new BN(value)
  return new BN(value.toString().substring(2), 'hex')
}

function getOutstandingDebt(
  loan: ActiveLoanData,
  currencyDecimals: number,
  lastUpdated: number,
  accrual?: InterestAccrual
) {
  if (!accrual) return new CurrencyBalance(0, currencyDecimals)
  const accRate = new Rate(accrual.accumulatedRate).toDecimal()
  const rate = new Rate(accrual.interestRatePerSec).toDecimal()
  const balance =
    'internal' in loan.pricing
      ? loan.pricing.internal.interest.normalizedAcc
      : loan.pricing.external.interest.normalizedAcc

  const normalizedDebt = new CurrencyBalance(balance, currencyDecimals).toDecimal()
  const secondsSinceUpdated = Date.now() / 1000 - lastUpdated

  const debtFromAccRate = normalizedDebt.mul(accRate)
  const debtSinceUpdated = normalizedDebt.mul(rate.minus(1).mul(secondsSinceUpdated))
  const debt = debtFromAccRate.add(debtSinceUpdated)

  return CurrencyBalance.fromFloat(debt, currencyDecimals)
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

function parseCurrencyKey(key: CurrencyKey): CurrencyKey {
  if (typeof key !== 'string' && 'Tranche' in key) {
    return {
      Tranche: [key.Tranche[0].replace(/\D/g, ''), key.Tranche[1]],
    }
  }
  return key
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
