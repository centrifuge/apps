import { StorageKey, u32 } from '@polkadot/types'
import { Codec } from '@polkadot/types-codec/types'
import { hash } from '@stablelib/blake2b'
import BN from 'bn.js'
import { combineLatest, EMPTY, expand, firstValueFrom, from, Observable, of, startWith } from 'rxjs'
import { combineLatestWith, filter, map, repeatWhen, switchMap, take } from 'rxjs/operators'
import { calculateOptimalSolution, SolverResult } from '..'
import { Centrifuge } from '../Centrifuge'
import { Account, TransactionOptions } from '../types'
import {
  InvestorTransactionType,
  SubqueryEpoch,
  SubqueryInvestorTransaction,
  SubqueryPoolSnapshot,
  SubqueryTrancheSnapshot,
} from '../types/subquery'
import { getDateYearsFromNow, getRandomUint, isSameAddress } from '../utils'
import { CurrencyBalance, Perquintill, Price, Rate, TokenBalance } from '../utils/BN'
import { Dec } from '../utils/Decimal'

const PerquintillBN = new BN(10).pow(new BN(18))
const PriceBN = new BN(10).pow(new BN(27))

const LoanPalletAccountId = '0x6d6f646c70616c2f6c6f616e0000000000000000000000000000000000000000'

type AdminRole = 'PoolAdmin' | 'Borrower' | 'PricingAdmin' | 'LiquidityAdmin' | 'MemberListAdmin' | 'LoanAdmin'

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
  MemberListAdmin: 0b00010000,
  LoanAdmin: 0b00100000,
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
      type: 'BulletLoan'
      advanceRate: BN
      probabilityOfDefault: BN
      lossGivenDefault: BN
      value: BN
      discountRate: BN
      maturityDate: string
    }
  | {
      type: 'CreditLine'
      advanceRate: BN
      value: BN
    }
  | {
      type: 'CreditLineWithMaturity'
      advanceRate: BN
      probabilityOfDefault: BN
      value: BN
      discountRate: BN
      maturityDate: string
      lossGivenDefault: BN
    }

const LOAN_INPUT_TRANSFORM = {
  value: (v: BN) => v.toString(),
  maturityDate: (v: string) => new Date(v).getTime() / 1000,
  probabilityOfDefault: (v: BN) => v.toString(),
  lossGivenDefault: (v: BN) => v.toString(),
  discountRate: (v: BN) => v.toString(),
  advanceRate: (v: BN) => v.toString(),
}

const LOAN_FIELDS = {
  BulletLoan: ['advanceRate', 'probabilityOfDefault', 'lossGivenDefault', 'value', 'discountRate', 'maturityDate'],
  CreditLine: ['advanceRate', 'value'],
  CreditLineWithMaturity: [
    'advanceRate',
    'probabilityOfDefault',
    'lossGivenDefault',
    'value',
    'discountRate',
    'maturityDate',
  ],
}

type LoanInfoData = {
  bulletLoan?: {
    advanceRate: string
    value: string
    probabilityOfDefault: string
    lossGivenDefault: string
    discountRate: string
    maturityDate: number
  }
  creditLine?: {
    advanceRate: string
    value: string
  }
  creditLineWithMaturity?: {
    advanceRate: string
    value: string
    probabilityOfDefault: string
    lossGivenDefault: string
    discountRate: string
    maturityDate: number
  }
}

type BulletLoan = {
  type: 'BulletLoan'
  advanceRate: Rate
  probabilityOfDefault: Rate
  lossGivenDefault: Rate
  value: CurrencyBalance
  discountRate: Rate
  maturityDate: string
}

type CreditLine = {
  type: 'CreditLine'
  advanceRate: Rate
  value: CurrencyBalance
}

type CreditLineWithMaturity = {
  type: 'CreditLineWithMaturity'
  advanceRate: Rate
  probabilityOfDefault: Rate
  value: CurrencyBalance
  discountRate: Rate
  maturityDate: string
  lossGivenDefault: Rate
}

export type LoanInfo = BulletLoan | CreditLine | CreditLineWithMaturity

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
    challengeTime: number
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
  latest: string
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
  isInitialised: boolean
  loanCollectionId: string | null
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
    challengeTime: number
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

type WrittenOfByAdmin = {
  percentage: Rate
  penaltyInterestRateRerSec: Rate
}

type WrittenOff = {
  writeOffStatus: number
}

type WriteOffStatus = null | WrittenOff | WrittenOfByAdmin

type InterestAccrual = {
  interestRatePerSec: string
  accumulatedRate: string
  referenceCount: number
}

// type from chain
type LoanData = {
  status: { [key in LoanStatus]: any }
  collateral: [collectionId: string, nftId: string]
}

// type from chain
type ActiveLoanData = LoanData & {
  loanId: number
  interestRatePerSec: string
  normalizedDebt: string
  originationDate: number | null
  loanType: { [key: string]: LoanInfoData }
  adminWrittenOff: boolean
  writeOffStatus: WriteOffStatus
  totalBorrowed: string
  totalRepaid: string
  lastUpdated: number
}

// type from chain
type ClosedLoanData = LoanData & {
  loanId: number
  interestRatePerSec: string
  normalizedDebt: string
  originationDate: number
  loanType: { [key: string]: LoanInfoData }
  writeOffStatus: WriteOffStatus
  totalBorrowed: string
  totalRepaid: string
  lastUpdated: number
}

// transformed type for UI
export type DefaultLoan = {
  status: 'Created'
  id: string
  poolId: string
  closedAt: null
  asset: {
    collectionId: string
    nftId: string
  }
}

// transformed type for UI
export type ActiveLoan = {
  status: 'Active'
  id: string
  poolId: string
  interestRatePerSec: Rate
  outstandingDebt: CurrencyBalance
  normalizedDebt: CurrencyBalance
  totalBorrowed: CurrencyBalance
  totalRepaid: CurrencyBalance
  lastUpdated: string
  closedAt: null
  originationDate: string
  loanInfo: LoanInfo
  adminWrittenOff?: boolean
  writeOffStatus: WriteOffStatus
  asset: {
    collectionId: string
    nftId: string
  }
}

// transformed type for UI
export type ClosedLoan = {
  status: 'Closed'
  id: string
  poolId: string
  interestRatePerSec: Rate
  outstandingDebt: CurrencyBalance
  normalizedDebt: CurrencyBalance
  totalBorrowed: CurrencyBalance
  totalRepaid: CurrencyBalance
  lastUpdated: string
  closedAt: string
  originationDate?: string | null
  loanInfo: LoanInfo
  writeOffStatus: WriteOffStatus
  asset: {
    collectionId: string
    nftId: string
  }
}

export type Loan = DefaultLoan | ClosedLoan | ActiveLoan

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
}

interface TrancheFormValues {
  tokenName: string
  symbolName: string
  interestRate: number | ''
  minRiskBuffer: number | ''
  minInvestment: number | ''
}
interface RiskGroupFormValues {
  groupName: string
  advanceRate: number | ''
  fee: number | ''
  probabilityOfDefault: number | ''
  lossGivenDefault: number | ''
  discountRate: number | ''
}

export type IssuerDetails = {
  title: string
  body: string
}

export interface PoolMetadataInput {
  // details
  poolIcon: { uri: string; mime: string } | null
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
  issuerLogo?: { uri: string; mime: string } | null
  issuerDescription: string

  executiveSummary: { uri: string; mime: string } | null
  website: string
  forum: string
  email: string
  details?: IssuerDetails[]

  // tranche
  tranches: TrancheFormValues[]
  riskGroups: RiskGroupFormValues[]
}

export type PoolStatus = 'open' | 'upcoming' | 'hidden'
export type PoolCountry = 'us' | 'non-us'
export type NonSolicitationNotice = 'all' | 'non-us' | 'none'
export type PoolMetadata = {
  version?: number
  pool: {
    name: string
    icon: { uri: string; mime: string } | null
    asset: {
      class: string
    }
    issuer: {
      name: string
      description: string
      email: string
      logo?: { uri: string; mime: string } | null
    }
    links: {
      executiveSummary: { uri: string; mime: string } | null
      forum?: string
      website?: string
    }
    details?: IssuerDetails[]
    status: PoolStatus
    listed: boolean
  }
  pod?: {
    url: string | null
  }
  tranches: Record<
    string,
    {
      icon?: { uri: string; mime: string } | null
      minInitialInvestment?: string
    }
  >
  loanTemplates?: {
    id: string
    createdAt: string
  }[]
  riskGroups: {
    name: string | undefined
    advanceRate: string
    interestRatePerSec: string
    probabilityOfDefault: string
    lossGivenDefault: string
    discountRate: string
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
    const [admin, poolId, collectionId, tranches, currency, maxReserve, metadata] = args

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
            let submittable
            if (['propose', 'notePreimage'].includes(options?.createType ?? '')) {
              submittable = api.tx.poolRegistry.register(
                admin,
                poolId,
                trancheInput,
                currency,
                maxReserve.toString(),
                pinnedMetadata.ipfsHash
              )
            } else {
              submittable = api.tx.utility.batchAll([
                api.tx.uniques.create(collectionId, LoanPalletAccountId),
                api.tx.poolRegistry.register(
                  inst.getSignerAddress(),
                  poolId,
                  trancheInput,
                  currency,
                  maxReserve.toString(),
                  pinnedMetadata.ipfsHash
                ),
                api.tx.permissions.add(
                  { PoolRole: 'PoolAdmin' },
                  admin,
                  { Pool: poolId },
                  {
                    PoolRole: 'LoanAdmin',
                  }
                ),
                api.tx.loans.initialisePool(poolId, collectionId),
              ])
            }
            if (options?.createType === 'propose') {
              const proposalSubmittable = api.tx.utility.batchAll([
                api.tx.preimage.notePreimage(submittable.method.toHex()),
                api.tx.democracy.propose({ Inline: submittable.method.hash }, api.consts.democracy.minimumDeposit),
              ])
              return inst.wrapSignAndSend(api, proposalSubmittable, options)
            }
            if (options?.createType === 'notePreimage') {
              const preimageSubmittable = api.tx.preimage.notePreimage(submittable.method.toHex())
              return inst.wrapSignAndSend(api, preimageSubmittable, options)
            }
            return inst.wrapSignAndSend(api, submittable, options)
          })
        )
      )
    )
  }

  function initialisePool(
    args: [admin: string, poolId: string, loanCollectionId: string, collateralCollectionId?: string],
    options?: TransactionOptions
  ) {
    const [admin, poolId, loanCollectionId, collateralCollectionId] = args

    return inst.getApi().pipe(
      switchMap((api) => {
        const submittable = api.tx.utility.batchAll(
          [
            api.tx.uniques.create(loanCollectionId, LoanPalletAccountId),
            collateralCollectionId && api.tx.uniques.create(collateralCollectionId, admin),
            api.tx.permissions.add(
              { PoolRole: 'PoolAdmin' },
              admin,
              { Pool: poolId },
              {
                PoolRole: 'LoanAdmin',
              }
            ),
            api.tx.loans.initialisePool(poolId, loanCollectionId),
          ].filter(Boolean)
        )
        return inst.wrapSignAndSend(api, submittable, options)
      })
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
      return of({ uri: `ipfs://ipfs/${hash}`, ipfsHash: hash })
    }

    const tranchesById: PoolMetadata['tranches'] = {}
    metadata.tranches.forEach((tranche, index) => {
      tranchesById[computeTrancheId(index, poolId)] = {
        minInitialInvestment: CurrencyBalance.fromFloat(tranche.minInvestment, currencyDecimals).toString(),
      }
    })

    const formattedMetadata = {
      version: 1,
      pool: {
        name: metadata.poolName,
        icon: metadata.poolIcon,
        asset: { class: metadata.assetClass },
        issuer: {
          name: metadata.issuerName,
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
        url: metadata.podEndpoint ?? null,
      },
      tranches: tranchesById,
      riskGroups: metadata.riskGroups.map((group) => ({
        name: group.groupName,
        advanceRate: Rate.fromPercent(group.advanceRate).toString(),
        interestRatePerSec: Rate.fromAprPercent(group.fee).toString(),
        probabilityOfDefault: Rate.fromPercent(group.probabilityOfDefault).toString(),
        lossGivenDefault: Rate.fromPercent(group.lossGivenDefault).toString(),
        discountRate: Rate.fromAprPercent(group.discountRate).toString(),
      })),
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
          newValue: tranchesInput.map((t) => [
            t.interestRatePerSec
              ? { NonResidual: [t.interestRatePerSec.toString(), t.minRiskBuffer?.toString()] }
              : 'Residual',
          ]),
        }
      : undefined
    const maxNavAge = maxNavAgeInput ? { newValue: maxNavAgeInput } : undefined

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.poolRegistry.update(poolId, { minEpochTime, tranches, maxNavAge })
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function updatePoolRoles(
    args: [poolId: string, add: [Account, PoolRoleInput][], remove: [Account, PoolRoleInput][]],
    options?: TransactionOptions
  ) {
    const [poolId, add, remove] = args
    const signer = inst.getSignerAddress()
    // Make sure a removal of the PoolAdmin role of the signer is the last tx in the batch, otherwise the later txs will fail
    const sortedRemove = [...remove].sort(([addr, role]) =>
      role === 'PoolAdmin' && isSameAddress(addr, signer) ? 1 : -1
    )
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.utility.batchAll([
          ...add.map(([addr, role]) =>
            api.tx.permissions.add(
              { PoolRole: typeof role === 'string' ? 'PoolAdmin' : 'MemberListAdmin' },
              addr,
              { Pool: poolId },
              { PoolRole: role }
            )
          ),
          ...sortedRemove.map(([addr, role]) =>
            api.tx.permissions.remove(
              { PoolRole: typeof role === 'string' ? 'PoolAdmin' : 'MemberListAdmin' },
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

    const address = inst.getSignerAddress()

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
    const address = inst.getSignerAddress()

    return inst.getApi().pipe(
      switchMap(
        (api) => api.query.investments.redeemOrderId([poolId, trancheId]),
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
            api.tx.investments.updateRedeemOrder([poolId, trancheId], newOrder.toString()),
          ])
        } else {
          submittable = api.tx.investments.updateRedeemOrder([poolId, trancheId], newOrder.toString())
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
            api.tx.loans.updateNav(poolId),
            api.tx.poolSystem.closeEpoch(poolId),
            api.tx.poolSystem.submitSolution(poolId, trancheSolution),
          ])
          return inst.wrapSignAndSend(api, submittable, options)
        }
        const submittable = api.tx.utility.batchAll([
          api.tx.loans.updateNav(poolId),
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
    const address = inst.getSignerAddress()

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
                ['PoolAdmin', 'Borrower', 'PricingAdmin', 'LiquidityAdmin', 'MemberListAdmin', 'LoanAdmin'] as const
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
              const account = poolKeys[i][0]
              const permissions = value.toJSON() as any
              roles[account] = {
                roles: (
                  ['PoolAdmin', 'Borrower', 'PricingAdmin', 'LiquidityAdmin', 'MemberListAdmin', 'LoanAdmin'] as const
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

  function createLoan(args: [poolId: string, collectionId: string, nftId: string], options?: TransactionOptions) {
    const [poolId, collectionId, nftId] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.loans.create(poolId, [collectionId, nftId])
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function priceLoan(
    args: [poolId: string, loanId: string, interestRatePerSec: Rate, loanInfoInput: LoanInfoInput],
    options?: TransactionOptions
  ) {
    const [poolId, loanId, ratePerSec, loanInfoInput] = args
    const ratePerYear = Rate.fromFloat(new Rate(ratePerSec).toApr().toDecimalPlaces(4))
    const loanInfoFields = LOAN_FIELDS[loanInfoInput.type]
    const loanInfo = loanInfoFields.map((key) => (LOAN_INPUT_TRANSFORM as any)[key]((loanInfoInput as any)[key]))
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.loans.price(poolId, loanId, ratePerYear, {
          [loanInfoInput.type]: loanInfo,
        })
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function financeLoan(args: [poolId: string, loanId: string, amount: BN], options?: TransactionOptions) {
    const [poolId, loanId, amount] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.loans.borrow(poolId, loanId, amount.toString())
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function repayLoanPartially(args: [poolId: string, loanId: string, amount: BN], options?: TransactionOptions) {
    const [poolId, loanId, amount] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.loans.repay(poolId, loanId, amount.toString())
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function repayAndCloseLoan(args: [poolId: string, loanId: string], options?: TransactionOptions) {
    const [poolId, loanId] = args
    const $api = inst.getApi()

    return $api.pipe(
      combineLatestWith(getLoan([poolId, loanId])),
      combineLatestWith(getPool([poolId])),
      take(1),
      switchMap(([[api, loan], pool]) => {
        // Calculate the debt an hour from now to have some margin
        const secondsPerHour = 60 * 60
        const debtWithMargin =
          loan?.status === 'Active'
            ? loan.outstandingDebt
                .toDecimal()
                .add(
                  loan.normalizedDebt.toDecimal().mul(loan.interestRatePerSec.toDecimal().minus(1).mul(secondsPerHour))
                )
            : Dec(0)
        const amount = CurrencyBalance.fromFloat(debtWithMargin || 0, pool.currency.decimals).toString()
        const submittable = api.tx.utility.batchAll([
          api.tx.loans.repay(poolId, loanId, amount),
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
            api.query.loans.poolNAV.entries(),
            api.query.poolSystem.epochExecution.entries(),
            api.query.loans.poolToLoanNftClass.entries(),
            getCurrencies(),
          ]),
        (api, [rawPools, rawMetadatas, rawNavs, rawEpochExecutions, rawLoanColIds, currencies]) => ({
          api,
          rawPools,
          rawMetadatas,
          rawNavs,
          rawEpochExecutions,
          rawLoanColIds,
          currencies,
        })
      ),
      switchMap(({ api, rawPools, rawMetadatas, rawNavs, rawEpochExecutions, rawLoanColIds, currencies }) => {
        if (!rawPools.length) return of([])

        const navMap = rawNavs.reduce((acc, [key, navValue]) => {
          const poolId = formatPoolKey(key as StorageKey<[u32]>)
          const nav = navValue.toJSON() as unknown as NAVDetailsData
          acc[poolId] = {
            latest: nav ? nav.latest : '0',
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

        const loanCollectionIdMap = rawLoanColIds.reduce((acc, [key, value]) => {
          const poolId = formatPoolKey(key as StorageKey<[u32]>)
          const colId = (value.toHuman() as string).replace(/\D/g, '')
          acc[poolId] = colId
          return acc
        }, {} as Record<string, string>)

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
              const loanCollectionId = loanCollectionIdMap[poolId]
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
                isInitialised: !!loanCollectionId,
                loanCollectionId: loanCollectionId ?? null,
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
                  challengeTime: api.consts.poolSystem.challengeTime.toJSON() as number, // in blocks
                },
                parameters: {
                  ...pool.parameters,
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

            let tranches: { [trancheId: string]: DailyTrancheState } = {}
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

  function getPoolLiquidityTransactions(args: [pool: Pool, fromEpoch: number, toEpoch: number]) {
    const [pool, fromEpoch, toEpoch] = args
    const $query = inst.getSubqueryObservable<{ epoches: { nodes: SubqueryEpoch[] } }>(
      `query($poolId: String!, $fromEpoch: Int!, $toEpoch: Int!) {
        epoches(
          filter: {
            poolId: { equalTo: $poolId },
            index: { greaterThanOrEqualTo: $fromEpoch },
            and: { index: { lessThanOrEqualTo: $toEpoch }}
          },
          orderBy: INDEX_ASC
        ) {
          nodes {
            id
            index
            openedAt
            closedAt
            executedAt
            sumBorrowedAmount
            sumRepaidAmount
            sumInvestedAmount
            sumRedeemedAmount
          }
        }
      }`,
      { poolId: pool.id, fromEpoch, toEpoch },
      false
    )

    return $query.pipe(
      map((data) => {
        return data!.epoches.nodes.map((node) => ({
          ...node,
          sumBorrowedAmount: node.sumBorrowedAmount
            ? new CurrencyBalance(node.sumBorrowedAmount, pool.currency.decimals)
            : undefined,
          sumRepaidAmount: node.sumRepaidAmount
            ? new CurrencyBalance(node.sumRepaidAmount, pool.currency.decimals)
            : undefined,
          sumInvestedAmount: node.sumInvestedAmount
            ? new CurrencyBalance(node.sumInvestedAmount, pool.currency.decimals)
            : undefined,
          sumRedeemedAmount: node.sumRedeemedAmount
            ? new CurrencyBalance(node.sumRedeemedAmount, pool.currency.decimals)
            : undefined,
        }))
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
        let poolStatesByMonth: { [monthYear: string]: DailyPoolState[] } = {}
        poolStates.forEach((poolState) => {
          const monthYear = new Date(poolState.timestamp).getMonth() + '-' + new Date(poolState.timestamp).getFullYear()
          if (monthYear in poolStatesByMonth) {
            poolStatesByMonth[monthYear] = [...poolStatesByMonth[monthYear], poolState]
          } else {
            poolStatesByMonth[monthYear] = [poolState]
          }
        })

        return Object.values(poolStatesByMonth).map((statesOneMonth) => {
          let base = statesOneMonth[statesOneMonth.length - 1]
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
        from: from ? from.toISOString() : getDateYearsFromNow(-10).toISOString(),
        to: to ? to.toISOString() : getDateYearsFromNow(10).toISOString(),
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
              }) as unknown as any[], // TODO: add typing
            ]
          })
        )
      )
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
            api.events.loans.Created.is(event) ||
            api.events.loans.Closed.is(event) ||
            api.events.loans.Priced.is(event) ||
            api.events.loans.Borrowed.is(event) ||
            api.events.loans.Repaid.is(event) ||
            api.events.loans.NAVUpdated.is(event)
        )
        return !!event
      })
    )

    return $api.pipe(
      switchMap(
        (api) => combineLatest([api.query.loans.activeLoans(poolId), api.query.poolSystem.pool(poolId)]).pipe(take(1)),
        (api, [activeLoanValues, poolValue]) => ({ api, activeLoanValues, poolValue })
      ),
      switchMap(({ api, activeLoanValues, poolValue }) => {
        const $rates = api.query.interestAccrual.rates().pipe(take(1))
        const $interestLastUpdated = api.query.interestAccrual.lastUpdated().pipe(take(1))
        const $currencyMeta = api.query.ormlAssetRegistry.metadata((poolValue.toHuman() as any).currency).pipe(take(1))
        return combineLatest([
          api.query.loans.loan.entries(poolId),
          of(activeLoanValues),
          api.query.loans.closedLoans.entries(poolId),
          $rates,
          $interestLastUpdated,
          $currencyMeta,
        ])
      }),
      map(([loanValues, activeLoanValues, closedLoansValues, rateValues, interestLastUpdated, rawCurrency]) => {
        const currency = rawCurrency.toHuman() as AssetCurrencyData
        const loans = (loanValues as any[]).map(([key, value]) => {
          const loan = value.toJSON() as unknown as LoanData
          const [collectionId, nftId] = loan.collateral
          return {
            id: formatLoanKey(key as StorageKey<[u32, u32]>),
            poolId,
            status: getLoanStatus(loan),
            closedAt: loan.status.Closed?.closed_at
              ? new Date(loan.status.Closed?.closed_at * 1000).toISOString()
              : null,
            asset: {
              collectionId: collectionId.toString(),
              nftId: hexToBN(nftId).toString(),
            },
          } as DefaultLoan
        })

        const activeLoanData = activeLoanValues.toJSON() as ActiveLoanData[]
        const rates = rateValues.toJSON() as InterestAccrual[]

        const activeLoans = activeLoanData.reduce<Record<string, Omit<ActiveLoan, 'status' | 'asset' | 'closedAt'>>>(
          (prev, activeLoan) => {
            const interestData = rates.find((rate) => rate.interestRatePerSec === activeLoan.interestRatePerSec)
            const mapped = {
              id: String(activeLoan.loanId),
              poolId,
              interestRatePerSec: new Rate(hexToBN(activeLoan.interestRatePerSec)),
              outstandingDebt: getOutstandingDebt(
                activeLoan,
                currency.decimals,
                interestLastUpdated.toJSON() as number,
                interestData?.accumulatedRate
              ),
              normalizedDebt: new CurrencyBalance(hexToBN(activeLoan.normalizedDebt), currency.decimals),
              totalBorrowed: new CurrencyBalance(hexToBN(activeLoan.totalBorrowed), currency.decimals),
              totalRepaid: new CurrencyBalance(hexToBN(activeLoan.totalRepaid), currency.decimals),
              lastUpdated: new Date(activeLoan.lastUpdated * 1000).toISOString(),
              originationDate: activeLoan.originationDate
                ? new Date(activeLoan.originationDate * 1000).toISOString()
                : '',
              loanInfo: getLoanInfo(activeLoan.loanType, currency.decimals),
              adminWrittenOff: activeLoan.adminWrittenOff,
              writeOffStatus: activeLoan.writeOffStatus,
            }
            return { ...prev, [String(activeLoan.loanId)]: mapped }
          },
          {}
        )

        const closedLoans = (closedLoansValues as any[]).reduce<
          Record<string, Omit<ClosedLoan, 'status' | 'asset' | 'adminWrittenOff' | 'closedAt'>>
        >((prev, [key, value]) => {
          const closedLoan = value.toJSON() as ClosedLoanData
          const loanId = formatLoanKey(key as StorageKey<[u32, u32]>)
          const loan = {
            id: loanId,
            poolId,
            interestRatePerSec: new Rate(hexToBN(closedLoan.interestRatePerSec)),
            outstandingDebt: new CurrencyBalance(0, currency.decimals),
            normalizedDebt: new CurrencyBalance(hexToBN(closedLoan.normalizedDebt), currency.decimals),
            totalBorrowed: new CurrencyBalance(hexToBN(closedLoan.totalBorrowed), currency.decimals),
            totalRepaid: new CurrencyBalance(hexToBN(closedLoan.totalRepaid), currency.decimals),
            lastUpdated: new Date(closedLoan.lastUpdated * 1000).toISOString(),
            originationDate: new Date(closedLoan.originationDate * 1000).toISOString(),
            loanInfo: getLoanInfo(closedLoan.loanType, currency.decimals),
            writeOffStatus: closedLoan.writeOffStatus,
          }
          return { ...prev, [loanId]: loan }
        }, {})

        return loans.map((loan) => ({ ...loan, ...activeLoans[loan.id], ...closedLoans[loan.id] })) as Loan[]
      }),
      repeatWhen(() => $events)
    )
  }

  function getWriteOffGroups(args: [poolId: string]) {
    const [poolId] = args
    const $api = inst.getApi()

    const $events = inst.getEvents().pipe(
      filter(({ api, events }) => {
        const event = events.find(({ event }) => api.events.loans.WriteOffGroupAdded.is(event))

        if (!event) return false

        const [pid] = (event.toHuman() as any).event.data
        return pid.replace(/\D/g, '') === poolId
      })
    )

    return $api.pipe(
      switchMap((api) => api.query.loans.poolWriteOffGroups(poolId)),
      map((writeOffGroupsValues) => {
        const writeOffGroups = writeOffGroupsValues.toJSON() as {
          overdueDays: number
          penaltyInterestRatePerSec: string
          percentage: string
        }[]
        return writeOffGroups.map((g) => {
          return {
            overdueDays: g.overdueDays as number,
            penaltyInterestRate: new Rate(hexToBN(g.penaltyInterestRatePerSec)),
            percentage: new Rate(hexToBN(g.percentage)),
          }
        })
      }),
      repeatWhen(() => $events)
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
                  // Multiply invest fulfilment in this epoch with outstanding order amount to get executed amount
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

  function getLoan(args: [poolId: string, loanId: string]) {
    const [poolId, loanId] = args
    return getLoans([poolId]).pipe(
      map((loans) => {
        const loanByLoanId = loans.find((loan) => loan.id === loanId)
        return loanByLoanId
      })
    )
  }

  function addWriteOffGroups(
    args: [poolId: string, writeOffGroups: { percentage: BN; overdueDays: number; penaltyInterestRate: BN }[]],
    options?: TransactionOptions
  ) {
    const [poolId, writeOffGroups] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.utility.batchAll(
          writeOffGroups.map((g) =>
            api.tx.loans.addWriteOffGroup(poolId, {
              percentage: g.percentage.toString(),
              overdueDays: g.overdueDays,
              penaltyInterestRatePerSec: g.penaltyInterestRate.toString(),
            })
          )
        )
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
    createPool,
    initialisePool,
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
    priceLoan,
    financeLoan,
    repayLoanPartially,
    repayAndCloseLoan,
    closeLoan,
    getPools,
    getBalances,
    getOrder,
    getPoolOrders,
    getLoans,
    getPendingCollect,
    getWriteOffGroups,
    addWriteOffGroups,
    adminWriteOff,
    getAvailablePoolId,
    getDailyPoolStates,
    getMonthlyPoolStates,
    getInvestorTransactions,
    getNativeCurrency,
    getCurrencies,
    getDailyTrancheStates,
    getPoolLiquidityTransactions,
  }
}

function hexToBN(value: string | number) {
  if (typeof value === 'number') return new BN(value)
  return new BN(value.toString().substring(2), 'hex')
}

function getLoanInfo(loanType: LoanInfoData, currencyDecimals: number): LoanInfo {
  if (loanType.bulletLoan) {
    return {
      type: 'BulletLoan',
      advanceRate: new Rate(hexToBN(loanType.bulletLoan.advanceRate)),
      probabilityOfDefault: new Rate(hexToBN(loanType.bulletLoan.probabilityOfDefault)),
      lossGivenDefault: new Rate(hexToBN(loanType.bulletLoan.lossGivenDefault)),
      value: new CurrencyBalance(hexToBN(loanType.bulletLoan.value), currencyDecimals),
      discountRate: new Rate(hexToBN(loanType.bulletLoan.discountRate)),
      maturityDate: new Date(loanType.bulletLoan.maturityDate * 1000).toISOString(),
    }
  }
  if (loanType.creditLine) {
    return {
      type: 'CreditLine',
      advanceRate: new Rate(hexToBN(loanType.creditLine.advanceRate)),
      value: new CurrencyBalance(hexToBN(loanType.creditLine.value), currencyDecimals),
    }
  }
  if (loanType.creditLineWithMaturity) {
    return {
      type: 'CreditLineWithMaturity',
      advanceRate: new Rate(hexToBN(loanType.creditLineWithMaturity.advanceRate)),
      probabilityOfDefault: new Rate(hexToBN(loanType.creditLineWithMaturity.probabilityOfDefault)),
      value: new CurrencyBalance(hexToBN(loanType.creditLineWithMaturity.value), currencyDecimals),
      discountRate: new Rate(hexToBN(loanType.creditLineWithMaturity.discountRate)),
      maturityDate: new Date(loanType.creditLineWithMaturity.maturityDate * 1000).toISOString(),
      lossGivenDefault: new Rate(hexToBN(loanType.creditLineWithMaturity.lossGivenDefault)),
    }
  }

  throw new Error(`Unrecognized loan info: ${JSON.stringify(loanType)}`)
}

function getOutstandingDebt(
  loan: ActiveLoanData,
  currencyDecimals: number,
  lastUpdated: number,
  accumulatedRate?: InterestAccrual['accumulatedRate']
) {
  if (!accumulatedRate) return new CurrencyBalance(0, currencyDecimals)
  const accRate = new Rate(hexToBN(accumulatedRate)).toDecimal()
  const rate = new Rate(hexToBN(loan.interestRatePerSec)).toDecimal()
  const normalizedDebt = new CurrencyBalance(hexToBN(loan.normalizedDebt), currencyDecimals).toDecimal()
  const secondsSinceUpdated = Date.now() / 1000 - lastUpdated

  const debtFromAccRate = normalizedDebt.mul(accRate)
  const debtSinceUpdated = normalizedDebt.mul(rate.minus(1).mul(secondsSinceUpdated))
  const debt = debtFromAccRate.add(debtSinceUpdated)

  return CurrencyBalance.fromFloat(debt, currencyDecimals)
}

function getLoanStatus(loanValue: LoanData) {
  const status = Object.keys(loanValue.status)[0]
  return `${status.charAt(0).toUpperCase()}${status.slice(1)}` as LoanStatus
}

function computeTrancheId(trancheIndex: number, poolId: string) {
  const a = new BN(trancheIndex).toArray('le', 8)
  const b = new BN(poolId).toArray('le', 8)
  const data = Uint8Array.from(a.concat(b))

  return toHex(hash(data, 16))
}

function toHex(data: Uint8Array) {
  const hex = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f']
  const out = []

  for (let i = 0; i < data.length; i++) {
    out.push(hex[(data[i] >> 4) & 0xf])
    out.push(hex[data[i] & 0xf])
  }
  return `0x${out.join('')}`
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
  if (typeof key === 'string' || 'ForeignAsset' in key) return key
  return {
    Tranche: [key.Tranche[0].replace(/\D/g, ''), key.Tranche[1]],
  }
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
