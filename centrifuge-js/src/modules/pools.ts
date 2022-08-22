import { StorageKey, u32 } from '@polkadot/types'
import { hash } from '@stablelib/blake2b'
import BN from 'bn.js'
import { combineLatest, EMPTY, expand, firstValueFrom, from, of } from 'rxjs'
import { combineLatestWith, filter, map, repeatWhen, switchMap, take } from 'rxjs/operators'
import { calculateOptimalSolution } from '..'
import { Centrifuge } from '../Centrifuge'
import { Account, TransactionOptions } from '../types'
import { SubqueryPoolSnapshot } from '../types/subquery'
import { getRandomUint, isSameAddress } from '../utils'
import { CurrencyBalance, Perquintill, Price, Rate, TokenBalance } from '../utils/BN'
import { Dec } from '../utils/Decimal'

const PerquintillBN = new BN(10).pow(new BN(18))
const PriceBN = new BN(10).pow(new BN(27))

const LoanPalletAccountId = '0x6d6f646c70616c2f6c6f616e0000000000000000000000000000000000000000'

type AdminRole = 'PoolAdmin' | 'Borrower' | 'PricingAdmin' | 'LiquidityAdmin' | 'MemberListAdmin' | 'LoanAdmin'

type CurrencyRole = 'PermissionedAssetManager' | 'PermissionedAssetIssuer'

export type PoolRoleInput = AdminRole | { TrancheInvestor: [trancheId: string, permissionedTill: number] }

export type Currency = string

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
  outstandingInvestOrders: number
  outstandingRedeemOrders: number
  debt: string
  reserve: string
  ratio: string
  lastUpdatedInterest: number
}

type CurrencyData = { [key: string]: null } | { permissioned: string }

type PoolDetailsData = {
  currency: CurrencyData
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
  outstandingInvestOrders: CurrencyBalance
  outstandingRedeemOrders: TokenBalance
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
  currency: string
}

export type Pool = {
  id: string
  currency: Currency
  currencyDecimals: number
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
    isInSubmissionPeriod: boolean
    isInChallengePeriod: boolean
    isInExecutionPeriod: boolean
    challengePeriodEnd: number
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
  accumulatedRate: string
  lastUpdated: number
}

// type from chain
type LoanData = {
  status: LoanStatus
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
  currency: Currency
  balance: CurrencyBalance
}

export type AccountTokenBalance = {
  poolId: string
  trancheId: string
  balance: TokenBalance
}

export type TrancheInput = {
  interestRatePerSec?: BN
  minRiskBuffer?: BN
  seniority?: number
}

export type DailyPoolState = {
  poolState: {
    netAssetValue: CurrencyBalance
    totalReserve: CurrencyBalance
  }
  poolValue: CurrencyBalance
  currency: string
  timestamp: string
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

export interface PoolMetadataInput {
  // details
  poolIcon: { uri: string; mime: string } | null
  poolName: string
  assetClass: string
  currency: string
  maxReserve: number | ''
  epochHours: number | ''
  epochMinutes: number | ''
  nodeEndpoint: string

  // issuer
  issuerName: string
  issuerLogo?: { uri: string; mime: string } | null
  issuerDescription: string

  executiveSummary: { uri: string; mime: string } | null
  website: string
  forum: string
  email: string

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
      forum: string
      website: string
    }
    status: PoolStatus
    listed: boolean
  }
  node?: {
    url: string | null
  }
  tranches: Record<
    string,
    {
      name: string
      symbol: string
      minInitialInvestment: string
    }
  >
  schemas?: {
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
      currency: string | { permissioned: string },
      maxReserve: BN,
      metadata: PoolMetadataInput
    ],
    options?: TransactionOptions
  ) {
    const [admin, poolId, collectionId, tranches, currency, maxReserve, metadata] = args

    const trancheInput = tranches.map((t) => [
      t.interestRatePerSec
        ? { NonResidual: [t.interestRatePerSec.toString(), t.minRiskBuffer?.toString()] }
        : 'Residual',
    ])
    const $pinMetadata = pinPoolMetadata(metadata, poolId, currency, options)
    const $api = inst.getApi()

    return combineLatest([$api, $pinMetadata]).pipe(
      switchMap(([api, pinnedMetadata]) => {
        let submittable
        if (['propose', 'notePreimage'].includes(options?.createType ?? '')) {
          submittable = api.tx.pools.create(
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
            api.tx.pools.create(
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
            api.tx.democracy.notePreimage(submittable.method.toHex()),
            api.tx.democracy.propose(submittable.method.hash, api.consts.democracy.minimumDeposit),
          ])
          return inst.wrapSignAndSend(api, proposalSubmittable, options)
        }
        if (options?.createType === 'notePreimage') {
          const preimageSubmittable = api.tx.democracy.notePreimage(submittable.method.toHex())
          return inst.wrapSignAndSend(api, preimageSubmittable, options)
        }
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function pinPoolMetadata(
    metadata: PoolMetadataInput,
    poolId: string,
    currency: string | { permissioned: string },
    options?: TransactionOptions
  ) {
    if (options?.paymentInfo) {
      return of({ uri: '', ipfsHash: '' })
    }

    const tranchesById: PoolMetadata['tranches'] = {}
    metadata.tranches.forEach((tranche, index) => {
      tranchesById[computeTrancheId(index, poolId)] = {
        name: tranche.tokenName,
        symbol: tranche.symbolName,
        minInitialInvestment: CurrencyBalance.fromFloat(
          tranche.minInvestment,
          getCurrencyDecimals(currency)
        ).toString(),
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
        status: 'open',
        listed: true,
      },
      node: {
        url: metadata.nodeEndpoint ?? null,
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
      minEpochTime?: { newValue: number }
      tranches?: { newValue: any }
      maxNavAge?: { newValue: number }
    }
  ]

  function updatePool(args: UpdatePoolInput, options?: TransactionOptions) {
    const [poolId, updates] = args
    const { minEpochTime, tranches, maxNavAge } = updates
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.pools.update(poolId, { minEpochTime, tranches, maxNavAge })
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
        const submittable = api.tx.pools.setMaxReserve(poolId, maxReserve.toString())
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function setMetadata(args: [poolId: string, metadata: PoolMetadata], options?: TransactionOptions) {
    const [poolId, metadata] = args
    const $api = inst.getApi()

    if (metadata?.version) {
      metadata.version = (metadata.version as number) + 1
    } else {
      metadata.version = 1
    }

    const $pinnedMetadata = inst.metadata.pinJson(metadata)
    return combineLatest([$api, $pinnedMetadata]).pipe(
      switchMap(([api, pinnedMetadata]) => {
        const submittable = api.tx.pools.setMetadata(poolId, pinnedMetadata.ipfsHash)
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function updateInvestOrder(args: [poolId: string, trancheId: string, newOrder: BN], options?: TransactionOptions) {
    const [poolId, trancheId, newOrder] = args

    const address = inst.getSignerAddress()
    const $api = inst.getApi()

    return $api.pipe(
      combineLatestWith(getPool([poolId])),
      combineLatestWith(getOrder([address, poolId, trancheId])),
      take(1),
      switchMap(([[api, pool], order]) => {
        let submittable
        if (
          order.epoch <= pool.epoch.lastExecuted &&
          order.epoch > 0 &&
          (!order.invest.isZero() || !order.redeem.isZero())
        ) {
          submittable = api.tx.utility.batchAll([
            api.tx.pools.collect(poolId, { id: trancheId }, pool.epoch.lastExecuted + 1 - order.epoch),
            api.tx.pools.updateInvestOrder(poolId, { id: trancheId }, newOrder.toString()),
          ])
        } else {
          submittable = api.tx.pools.updateInvestOrder(poolId, { id: trancheId }, newOrder.toString())
        }
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function updateRedeemOrder(args: [poolId: string, trancheId: string, newOrder: BN], options?: TransactionOptions) {
    const [poolId, trancheId, newOrder] = args
    const address = inst.getSignerAddress()
    const $api = inst.getApi()

    return $api.pipe(
      combineLatestWith(getPool([poolId])),
      combineLatestWith(getOrder([address, poolId, trancheId])),
      take(1),
      switchMap(([[api, pool], order]) => {
        let submittable
        if (
          order.epoch <= pool.epoch.lastExecuted &&
          order.epoch > 0 &&
          (!order.invest.isZero() || !order.redeem.isZero())
        ) {
          submittable = api.tx.utility.batchAll([
            api.tx.pools.collect(poolId, { id: trancheId }, pool.epoch.lastExecuted + 1 - order.epoch),
            api.tx.pools.updateRedeemOrder(poolId, { id: trancheId }, newOrder.toString()),
          ])
        } else {
          submittable = api.tx.pools.updateRedeemOrder(poolId, { id: trancheId }, newOrder.toString())
        }
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function closeEpoch(args: [poolId: string], options?: TransactionOptions) {
    const [poolId] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.utility.batchAll([api.tx.loans.updateNav(poolId), api.tx.pools.closeEpoch(poolId)])
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function executeEpoch(args: [poolId: string], options?: TransactionOptions) {
    const [poolId] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.pools.executeEpoch(poolId)
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  function submitSolution(args: [poolId: string], options?: TransactionOptions) {
    const [poolId] = args
    const $pool = getPool([poolId]).pipe(take(1))
    const $api = inst.getApi()
    return combineLatest([$pool]).pipe(
      switchMap(([pool]) => {
        const solutionTranches = pool.tranches.map((tranche) => ({
          ratio: tranche.ratio,
          minRiskBuffer: tranche.minRiskBuffer,
        }))
        const poolState = {
          netAssetValue: pool.nav.latest,
          reserve: pool.reserve.total,
          tranches: solutionTranches,
          maxReserve: pool.reserve.max,
          currencyDecimals: pool.currencyDecimals,
        }
        const orders = pool.tranches.map((tranche) => ({
          invest: tranche.outstandingInvestOrders,
          redeem: tranche.outstandingRedeemOrders,
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
        const submittable = api.tx.pools.submitSolution(poolId, optimalSolution.tranches)
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
        combineLatestWith(getPool([poolId])),
        combineLatestWith(getOrder([address, poolId, trancheId])),
        switchMap(([[api, pool], order]) => {
          const submittable = api.tx.pools.collect(poolId, { id: trancheId }, pool.epoch.lastExecuted + 1 - order.epoch)
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
      switchMap(([api, { pool, orders }]) => {
        const submittable = api.tx.utility.batchAll(
          pool.tranches
            .map((_t, index: number) => {
              const nEpochs = pool.epoch.lastExecuted + 1 - orders[index].epoch
              if (!nEpochs) return null as any
              return api.tx.pools.collect(poolId, { index }, nEpochs)
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
    args: [poolId: string, loanId: string, interestRatePerSec: string, loanInfoInput: LoanInfoInput],
    options?: TransactionOptions
  ) {
    const [poolId, loanId, ratePerSec, loanInfoInput] = args
    const loanInfoFields = LOAN_FIELDS[loanInfoInput.type]
    const loanInfo = loanInfoFields.map((key) => (LOAN_INPUT_TRANSFORM as any)[key]((loanInfoInput as any)[key]))
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.loans.price(poolId, loanId, ratePerSec, {
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
        const amount = CurrencyBalance.fromFloat(debtWithMargin || 0, pool.currencyDecimals).toString()
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
            api.events.pools.Created.is(event) ||
            api.events.pools.Updated.is(event) ||
            api.events.pools.MaxReserveSet.is(event) ||
            api.events.pools.MetadataSet.is(event) ||
            api.events.pools.EpochClosed.is(event) ||
            api.events.pools.EpochExecuted.is(event) ||
            api.events.pools.InvestOrderUpdated.is(event) ||
            api.events.pools.RedeemOrderUpdated.is(event) ||
            api.events.pools.SolutionSubmitted.is(event)
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
            api.query.pools.pool.entries(),
            api.query.loans.poolNAV.entries(),
            api.query.pools.epochExecution.entries(),
          ]),
        (api, [rawPools, rawNavs, rawEpochExecutions]) => ({ api, rawPools, rawNavs, rawEpochExecutions })
      ),
      switchMap(({ api, rawPools, rawNavs, rawEpochExecutions }) => {
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
          const epoch = navValue.toJSON() as unknown as EpochExecutionData
          acc[poolId] = {
            epoch: epoch.epoch,
            challengePeriodEnd: epoch.challengePeriodEnd,
          }
          return acc
        }, {} as Record<string, Pick<EpochExecutionData, 'challengePeriodEnd' | 'epoch'>>)

        // read pools, poolIds and metadata from observable
        const pools = rawPools.map(([poolKeys, poolValue]) => ({
          id: formatPoolKey(poolKeys as any), // poolId
          data: poolValue.toJSON() as unknown as PoolDetailsData, // pool data
          metadata: (poolValue as any)?.toHuman()?.metadata, // pool metadata
        }))

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

        const epochKeys = keys.map((k) => k.slice(1))
        const $epochs = api.query.pools.epoch.multi(epochKeys).pipe(take(1))

        // TODO: Get the token prices via RPC again, currently not always accurate data
        // const $prices = combineLatest(
        //   // @ts-expect-error
        //   pools.map((p) => api.rpc.pools.trancheTokenPrices(p.id).pipe(startWith(null))) as Observable<Codec[] | null>[]
        // )

        const $block = api.rpc.chain.getBlock()

        return combineLatest([$issuance, $epochs, $block]).pipe(
          map(([rawIssuances, rawEpochs, { block }]) => {
            const blockNumber = block?.header?.number.toNumber()
            const epochs = rawEpochs.map((value) => (!value.isEmpty ? (value as any).toJSON() : null))
            const mappedPools = pools.map((poolObj) => {
              const { data: pool, id: poolId, metadata } = poolObj
              const navData = navMap[poolId]
              const epochExecution = epochExecutionMap[poolId]
              const currency = getCurrency(pool.currency)
              const currencyDecimals = getCurrencyDecimals(pool.currency)

              const poolValue = new CurrencyBalance(
                pool.tranches.tranches.reduce((prev: BN, tranche: TrancheDetailsData) => {
                  return new BN(prev.add(new BN(hexToBN(tranche.debt))).add(new BN(hexToBN(tranche.reserve))))
                }, new BN(0)),
                currencyDecimals
              )

              const maxReserve = new CurrencyBalance(hexToBN(pool.reserve.max), currencyDecimals)
              const availableReserve = new CurrencyBalance(hexToBN(pool.reserve.available), currencyDecimals)
              const totalReserve = new CurrencyBalance(hexToBN(pool.reserve.total), currencyDecimals)

              const mappedPool: Pool = {
                id: poolId,
                createdAt: null,
                metadata,
                currency,
                currencyDecimals,
                tranches: pool.tranches.tranches.map((tranche, index) => {
                  const trancheId = pool.tranches.ids[index]
                  const trancheIndex = trancheIdToIndex[trancheId]
                  const lastClosedEpoch = epochs[trancheIndex]

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
                    currencyDecimals
                  )

                  const tokenPrice = lastClosedEpoch
                    ? new Price(hexToBN(lastClosedEpoch.tokenPrice))
                    : Price.fromFloat(1)

                  const currentRiskBuffer = subordinateTranchesValue.gtn(0)
                    ? Perquintill.fromFloat(subordinateTranchesValue.toDecimal().div(poolValue.toDecimal()))
                    : new Perquintill(0)

                  const outstandingInvestOrders = new CurrencyBalance(
                    hexToBN(tranche.outstandingInvestOrders),
                    currencyDecimals
                  )
                  const outstandingRedeemOrders = new TokenBalance(
                    hexToBN(tranche.outstandingRedeemOrders),
                    currencyDecimals
                  )

                  const protection = minRiskBuffer?.toDecimal() ?? Dec(0)
                  const tvl = poolValue.toDecimal()
                  let capacityGivenMaxReserve = maxReserve
                    .toDecimal()
                    .minus(totalReserve.toDecimal())
                    .minus(outstandingInvestOrders.toDecimal())
                    .add(outstandingRedeemOrders.toDecimal())
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
                    currency,
                    currencyDecimals: 12,
                    totalIssuance: new TokenBalance(rawIssuances[trancheIndex].toString(), currencyDecimals),
                    poolId,
                    poolMetadata: (metadata ?? undefined) as string | undefined,
                    interestRatePerSec,
                    minRiskBuffer,
                    currentRiskBuffer,
                    capacity: CurrencyBalance.fromFloat(capacity, currencyDecimals),
                    ratio: new Perquintill(hexToBN(tranche.ratio)),
                    outstandingInvestOrders,
                    outstandingRedeemOrders,
                    lastUpdatedInterest: new Date(tranche.lastUpdatedInterest * 1000).toISOString(),
                    balance: new TokenBalance(hexToBN(tranche.debt).add(hexToBN(tranche.reserve)), currencyDecimals),
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
                  isInSubmissionPeriod: !!epochExecution && !epochExecution?.challengePeriodEnd,
                  isInChallengePeriod: epochExecution?.challengePeriodEnd >= blockNumber,
                  isInExecutionPeriod: epochExecution?.challengePeriodEnd < blockNumber,
                  challengePeriodEnd: epochExecution?.challengePeriodEnd,
                },
                parameters: {
                  ...pool.parameters,
                },
                nav: {
                  latest: navData?.latest
                    ? new CurrencyBalance(hexToBN(navData.latest), currencyDecimals)
                    : new CurrencyBalance(0, currencyDecimals),
                  lastUpdated: new Date((navData?.lastUpdated ?? 0) * 1000).toISOString(),
                },
                value: new CurrencyBalance(
                  hexToBN(pool.reserve.total).add(new BN(navData?.latest ? hexToBN(navData.latest) : 0)),
                  currencyDecimals
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

  function getDailyPoolStates(args: [poolId: string]) {
    const [poolId] = args
    const $api = inst.getApi()

    const $query = inst.getSubqueryObservable<{ poolSnapshots: { nodes: SubqueryPoolSnapshot[] } }>(
      `query($poolId: String!) {
        poolSnapshots(
          orderBy: BLOCK_NUMBER_ASC,
          filter: { 
            id: { startsWith: $poolId },
          }) {
          nodes {
            id
            timestamp
            totalReserve
            netAssetValue
          }
        }
      }
      `,
      {
        poolId,
      }
    )

    return $api.pipe(
      switchMap((api) =>
        combineLatest([$query, api.query.pools.pool(poolId).pipe(take(1))]).pipe(
          switchMap(([queryData, poolValue]) => {
            const pool = poolValue.toJSON() as unknown as PoolDetailsData
            const currencyDecimals = getCurrencyDecimals(pool.currency)
            return [
              queryData?.poolSnapshots.nodes.map((state) => {
                const poolState = {
                  id: state.id,
                  netAssetValue: new CurrencyBalance(state.netAssetValue, currencyDecimals),
                  totalReserve: new CurrencyBalance(state.totalReserve, currencyDecimals),
                }
                const poolValue = new CurrencyBalance(
                  new BN(state?.netAssetValue || '0').add(new BN(state?.totalReserve || '0')),
                  currencyDecimals
                )
                return { ...state, poolState, poolValue }
              }) as unknown as DailyPoolState[],
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

  function getBalances(args: [address: Account]) {
    const [address] = args
    const $api = inst.getApi()

    const $events = inst.getEvents()

    return $api.pipe(
      switchMap(
        (api) =>
          combineLatest([
            api.query.ormlTokens.accounts.entries(address),
            api.query.system.account(address),
            api.query.pools.pool.entries(),
          ]),
        (api, [rawBalances, nativeBalance, poolValues]) => ({ api, rawBalances, nativeBalance, poolValues })
      ),
      take(1),
      map(({ api, rawBalances, nativeBalance, poolValues }) => {
        const balances = {
          tranches: [] as AccountTokenBalance[],
          currencies: [] as AccountCurrencyBalance[],
          native: {
            balance: new BN((nativeBalance as any).data.free.toString()),
            decimals: api.registry.chainDecimals[0],
            symbol: api.registry.chainTokens[0],
          },
        }

        const decimalsByPool = Object.fromEntries(
          poolValues.map(([k, v]) => [formatPoolKey(k as any), getCurrencyDecimals((v.toJSON() as any).currency)])
        )

        rawBalances.forEach(([rawKey, rawValue]) => {
          const key = (rawKey.toHuman() as any)[1] as string | { Tranche: [string, string] } | { Permissioned: string }
          const value = rawValue.toJSON() as { free: string | number }

          if (typeof key === 'string') {
            const currency = key.toLowerCase()
            const currencyDecimals = currency.endsWith('usd') ? 12 : 18
            balances.currencies.push({
              currency,
              balance: new CurrencyBalance(hexToBN(value.free), currencyDecimals),
            })
          } else if ('Tranche' in key) {
            const [pid, trancheId] = key.Tranche
            const poolId = pid.replace(/\D/g, '')
            if (value.free !== 0) {
              balances.tranches.push({
                poolId,
                trancheId,
                balance: new TokenBalance(hexToBN(value.free), decimalsByPool[poolId.replace(/\D/g, '')]),
              })
            }
          } else {
            if (value.free !== 0) {
              const currency = key.Permissioned.toLowerCase()
              balances.currencies.push({
                currency,
                balance: new CurrencyBalance(hexToBN(value.free), 18),
              })
            }
          }
        })

        return balances
      }),
      repeatWhen(() => $events)
    )
  }

  function getOrder(args: [address: Account, poolId: string, trancheId: string]) {
    const [address, poolId, trancheId] = args

    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) =>
        combineLatest([api.query.pools.order(trancheId, address), api.query.pools.pool(poolId).pipe(take(1))])
      ),
      map(([orderValue, poolValue]) => {
        const order = orderValue.toJSON() as any
        const pool = poolValue.toJSON() as any as PoolDetailsData
        const currency = getCurrency(pool.currency)
        const currencyDecimals = getCurrencyDecimals(pool.currency)

        if (!order) {
          return {
            currency,
            invest: new CurrencyBalance(0, currencyDecimals),
            redeem: new TokenBalance(0, currencyDecimals),
            epoch: 0,
          }
        }

        return {
          currency,
          invest: new CurrencyBalance(hexToBN(order.invest), currencyDecimals),
          redeem: new TokenBalance(hexToBN(order.redeem), currencyDecimals),
          epoch: order.epoch as number,
        }
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
        (api) => combineLatest([api.query.loans.activeLoans(poolId), api.query.pools.pool(poolId)]).pipe(take(1)),
        (api, [activeLoanValues, poolValue]) => ({ api, activeLoanValues, poolValue })
      ),
      switchMap(({ api, activeLoanValues, poolValue }) => {
        const activeLoanData = activeLoanValues.toJSON() as ActiveLoanData[]
        const interestAccrualKeys = activeLoanData.map((activeLoan) => hexToBN(activeLoan.interestRatePerSec))
        const $interestAccrual = api.query.interestAccrual.rate.multi(interestAccrualKeys).pipe(take(1))
        return combineLatest([
          api.query.loans.loan.entries(poolId),
          of(activeLoanValues),
          api.query.loans.closedLoans.entries(poolId),
          $interestAccrual,
          of(poolValue),
        ])
      }),
      map(([loanValues, activeLoanValues, closedLoansValues, interestAccrual, poolValue]) => {
        const pool = poolValue.toJSON() as any as PoolDetailsData
        const currencyDecimals = getCurrencyDecimals(pool.currency)
        const loans = (loanValues as any[]).map(([key, value]) => {
          const loan = value.toJSON() as unknown as LoanData
          const [collectionId, nftId] = loan.collateral
          return {
            id: formatLoanKey(key as StorageKey<[u32, u32]>),
            poolId,
            status: getLoanStatus(loan),
            asset: {
              collectionId: collectionId.toString(),
              nftId: nftId.toString(),
            },
          } as DefaultLoan
        })

        const activeLoanData = activeLoanValues.toJSON() as ActiveLoanData[]
        const activeLoans = activeLoanData.reduce<Record<string, Omit<ActiveLoan, 'status' | 'asset'>>>(
          (prev, activeLoan, index) => {
            const interestData = interestAccrual[index].toJSON() as InterestAccrual
            const mapped = {
              id: String(activeLoan.loanId),
              poolId,
              interestRatePerSec: new Rate(hexToBN(activeLoan.interestRatePerSec)),
              outstandingDebt: getOutstandingDebt(activeLoan, currencyDecimals, interestData),
              normalizedDebt: new CurrencyBalance(hexToBN(activeLoan.normalizedDebt), currencyDecimals),
              totalBorrowed: new CurrencyBalance(hexToBN(activeLoan.totalBorrowed), currencyDecimals),
              totalRepaid: new CurrencyBalance(hexToBN(activeLoan.totalRepaid), currencyDecimals),
              lastUpdated: new Date(activeLoan.lastUpdated * 1000).toISOString(),
              originationDate: activeLoan.originationDate
                ? new Date(activeLoan.originationDate * 1000).toISOString()
                : '',
              loanInfo: getLoanInfo(activeLoan.loanType, currencyDecimals),
              adminWrittenOff: activeLoan.adminWrittenOff,
              writeOffStatus: activeLoan.writeOffStatus,
            }
            return { ...prev, [String(activeLoan.loanId)]: mapped }
          },
          {}
        )

        const closedLoans = (closedLoansValues as any[]).reduce<
          Record<string, Omit<ClosedLoan, 'status' | 'asset' | 'adminWrittenOff'>>
        >((prev, [key, value]) => {
          const closedLoan = value.toJSON() as ClosedLoanData
          const loanId = formatLoanKey(key as StorageKey<[u32, u32]>)
          const loan = {
            id: loanId,
            poolId,
            interestRatePerSec: new Rate(hexToBN(closedLoan.interestRatePerSec)),
            outstandingDebt: new CurrencyBalance(0, currencyDecimals),
            normalizedDebt: new CurrencyBalance(hexToBN(closedLoan.normalizedDebt), currencyDecimals),
            totalBorrowed: new CurrencyBalance(hexToBN(closedLoan.totalBorrowed), currencyDecimals),
            totalRepaid: new CurrencyBalance(hexToBN(closedLoan.totalRepaid), currencyDecimals),
            lastUpdated: new Date(closedLoan.lastUpdated * 1000).toISOString(),
            originationDate: new Date(closedLoan.originationDate * 1000).toISOString(),
            loanInfo: getLoanInfo(closedLoan.loanType, currencyDecimals),
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
        const currencyDecimals = getCurrencyDecimals(order.currency)
        if (order.epoch <= executedEpoch && order.epoch > 0 && (!order.invest.isZero() || !order.redeem.isZero())) {
          const epochKeys = Array.from({ length: executedEpoch + 1 - order.epoch }, (_, i) => [
            trancheId,
            order.epoch + i,
          ])
          const $epochs = api.query.pools.epoch.multi(epochKeys)

          return $epochs.pipe(
            map((epochs) => {
              let payoutCurrencyAmount = new BN(0)
              let payoutTokenAmount = new BN(0)
              let remainingInvestCurrency = new BN(order.invest)
              let remainingRedeemToken = new BN(order.redeem)

              for (const epoch of epochs) {
                if (remainingInvestCurrency.isZero() && remainingRedeemToken.isZero()) break

                let { investFulfillment, redeemFulfillment, tokenPrice } = epoch.toJSON() as any

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
                investCurrency: new CurrencyBalance(order.invest, currencyDecimals),
                redeemToken: new TokenBalance(order.redeem, currencyDecimals),
                epoch: order.epoch,
                payoutCurrencyAmount: new CurrencyBalance(payoutCurrencyAmount, currencyDecimals),
                payoutTokenAmount: new TokenBalance(payoutTokenAmount, currencyDecimals),
                remainingInvestCurrency: new CurrencyBalance(remainingInvestCurrency, currencyDecimals),
                remainingRedeemToken: new TokenBalance(remainingRedeemToken, currencyDecimals),
              }
            })
          )
        }
        return of({
          investCurrency: new CurrencyBalance(order.invest, currencyDecimals),
          redeemToken: new TokenBalance(order.redeem, currencyDecimals),
          epoch: order.epoch,
          payoutCurrencyAmount: new CurrencyBalance(0, currencyDecimals),
          payoutTokenAmount: new TokenBalance(0, currencyDecimals),
          remainingInvestCurrency: new CurrencyBalance(order.invest, currencyDecimals),
          remainingRedeemToken: new TokenBalance(order.redeem, currencyDecimals),
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

  function getLoanCollectionIdForPool(args: [poolId: string]) {
    const [poolId] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => api.query.loans.poolToLoanNftClass(poolId)),
      map((result) => {
        const collectionId = (result.toHuman() as string).replace(/\D/g, '')

        return collectionId
      }),
      take(1)
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

            return api.query.pools.pool(id).pipe(
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
    getLoans,
    getPendingCollect,
    getWriteOffGroups,
    addWriteOffGroups,
    adminWriteOff,
    getLoanCollectionIdForPool,
    getAvailablePoolId,
    getDailyPoolStates,
    getNativeCurrency,
  }
}

function hexToBN(value: string | number) {
  if (typeof value === 'number') return new BN(value)
  return new BN(value.toString().substring(2), 'hex')
}

function getCurrency(data?: CurrencyData | string) {
  if (!data) return ''
  if (typeof data === 'string') return data.toLowerCase()
  const cur = 'permissioned' in data ? data.permissioned! : Object.keys(data)[0]
  return cur.toLowerCase()
}

function getCurrencyDecimals(data?: CurrencyData | string) {
  const currency = getCurrency(data)
  return currency.endsWith('usd') ? 12 : 18
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

function getOutstandingDebt(loan: ActiveLoanData, currencyDecimals: number, interestAccrual?: InterestAccrual) {
  if (!interestAccrual) return new CurrencyBalance(0, currencyDecimals)
  const accRate = new Rate(hexToBN(interestAccrual.accumulatedRate)).toDecimal()
  const rate = new Rate(hexToBN(loan.interestRatePerSec)).toDecimal()
  const normalizedDebt = new CurrencyBalance(hexToBN(loan.normalizedDebt), currencyDecimals).toDecimal()
  const secondsSinceUpdated = Date.now() / 1000 - interestAccrual.lastUpdated

  const debtFromAccRate = normalizedDebt.mul(accRate)
  const debtSinceUpdated = normalizedDebt.mul(rate.minus(1).mul(secondsSinceUpdated))
  const debt = debtFromAccRate.add(debtSinceUpdated)

  return CurrencyBalance.fromFloat(debt, currencyDecimals)
}

const getLoanStatus = (loanValue: LoanData) => {
  const status = Object.keys(loanValue.status)[0]
  return `${status.charAt(0).toUpperCase()}${status.slice(1)}` as LoanStatus
}

const computeTrancheId = (trancheIndex: number, poolId: string) => {
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
