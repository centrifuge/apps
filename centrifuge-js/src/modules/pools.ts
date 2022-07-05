import { StorageKey, u32 } from '@polkadot/types'
import BN from 'bn.js'
import { combineLatest, EMPTY, expand, firstValueFrom, of } from 'rxjs'
import { combineLatestWith, filter, map, repeatWhen, startWith, switchMap, take } from 'rxjs/operators'
import { CentrifugeBase } from '../CentrifugeBase'
import { Account, TransactionOptions } from '../types'
import { SubqueryPoolSnapshot } from '../types/subquery'
import { getRandomUint, isSameAddress } from '../utils'
import { Balance, Perquintill, Price, Rate } from '../utils/BN'

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
  value: Balance
  discountRate: Rate
  maturityDate: string
}

type CreditLine = {
  type: 'CreditLine'
  advanceRate: Rate
  value: Balance
}

type CreditLineWithMaturity = {
  type: 'CreditLineWithMaturity'
  advanceRate: Rate
  probabilityOfDefault: Rate
  value: Balance
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

export type Tranche = {
  index: number
  id: string
  seniority: number
  balance: Balance
  minRiskBuffer: Perquintill | null
  currentRiskBuffer: Perquintill
  interestRatePerSec: Rate | null
  outstandingInvestOrders: Balance
  outstandingRedeemOrders: Balance
  lastUpdatedInterest: string
  ratio: Perquintill
}

export type TrancheWithTokenPrice = Tranche & {
  totalIssuance: Balance
  tokenPrice: null | Price
}

export type Token = TrancheWithTokenPrice & {
  poolId: string
  poolMetadata: string | undefined
  currency: string
}

export type Pool = {
  id: string
  currency: Currency
  metadata?: string
  value: Balance
  createdAt: string | null
  tranches: Token[]
  reserve: {
    max: Balance
    available: Balance
    total: Balance
  }
  epoch: {
    current: number
    lastClosed: string
    lastExecuted: number
    // inSubmissionPeriod: number | null
  }
  nav: {
    latest: Balance
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

type LoanDetailsData = {
  status: LoanStatus
  collateral: [collectionId: string, nftId: string]
}

type ActiveLoanDetilsData = LoanDetailsData & {
  loanId: number
  interestRatePerSec: string
  normalizedDebt: string
  originationDate: number
  loanType: { [key: string]: LoanInfoData }
  adminWrittenOff: boolean
  writeOffStatus: WriteOffStatus
  totalBorrowed: string
  totalRepaid: string
  lastUpdated: number
}

type ClosedLoanDetilsData = LoanDetailsData & {
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

export type Loan = {
  id: string
  poolId: string
  interestRatePerSec: Rate
  outstandingDebt: Balance
  normalizedDebt: Balance
  totalBorrowed: Balance
  totalRepaid: Balance
  lastUpdated: string | null
  originationDate: string | null
  status: LoanStatus
  loanInfo: LoanInfo | null
  adminWrittenOff: boolean | null
  writeOffStatus: WriteOffStatus
  asset: {
    collectionId: string
    nftId: string
  }
}

export type CurrencyBalance = {
  currency: Currency
  balance: Balance
}

export type TrancheBalance = {
  poolId: string
  trancheId: string
  balance: Balance
}

export type TrancheInput = {
  interestRatePerSec?: BN
  minRiskBuffer?: BN
  seniority?: number
}

export type DailyPoolState = {
  poolState: {
    netAssetValue: Balance
    totalReserve: Balance
  }
  poolValue: Balance
  currency: string
  timestamp: string
}

const formatPoolKey = (keys: StorageKey<[u32]>) => (keys.toHuman() as string[])[0].replace(/\D/g, '')
const formatLoanKey = (keys: StorageKey<[u32, u32]>) => (keys.toHuman() as string[])[1].replace(/\D/g, '')

const MAX_ATTEMPTS = 10

export function getPoolsModule(inst: CentrifugeBase) {
  function createPool(
    args: [
      admin: string,
      poolId: string,
      collectionId: string,
      tranches: TrancheInput[],
      currency: string | { permissioned: string },
      maxReserve: BN,
      metadata: string,
      writeOffGroups: { overdueDays: number; percentage: BN }[]
    ],
    options?: TransactionOptions
  ) {
    const [admin, poolId, collectionId, tranches, currency, maxReserve, metadata, writeOffGroups] = args

    const $api = inst.getApi()

    const trancheInput = tranches.map((t) => [
      t.interestRatePerSec
        ? { NonResidual: [t.interestRatePerSec.toString(), t.minRiskBuffer?.toString()] }
        : 'Residual',
    ])

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.utility.batchAll(
          [
            api.tx.uniques.create(collectionId, LoanPalletAccountId),
            api.tx.pools.create(admin, poolId, trancheInput, currency, maxReserve.toString()),
            api.tx.pools.setMetadata(poolId, metadata),
            api.tx.permissions.add(
              { PoolRole: 'PoolAdmin' },
              inst.getSignerAddress(),
              { Pool: poolId },
              {
                PoolRole: 'LoanAdmin',
              }
            ),
            api.tx.loans.initialisePool(poolId, collectionId),
          ].concat(
            writeOffGroups.map((g) =>
              api.tx.loans.addWriteOffGroup(poolId, {
                percentage: g.percentage.toString(),
                overdueDays: g.overdueDays,
                penaltyInterestRatePerSec: null,
              })
            )
          )
        )
        return inst.wrapSignAndSend(api, submittable, options)
      })
    )
  }

  type UpdatePoolInput = {
    poolId: string
    minEpochTime?: { newValue: number }
    tranches?: { newValue: any }
    maxNavAge?: { newValue: number }
  }

  function updatePool(args: UpdatePoolInput, options?: TransactionOptions) {
    const { poolId } = args
    const minEpochTime = args?.minEpochTime
    const tranches = args?.tranches
    const maxNavAge = args?.maxNavAge
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
            api.tx.permissions.add({ PoolRole: 'PoolAdmin' }, addr, { Pool: poolId }, { PoolRole: role })
          ),
          ...sortedRemove.map(([addr, role]) =>
            api.tx.permissions.remove({ PoolRole: 'PoolAdmin' }, addr, { Pool: poolId }, { PoolRole: role })
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

  function setMetadata(args: [poolId: string, metadata: string], options?: TransactionOptions) {
    const [poolId, metadata] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.pools.setMetadata(poolId, metadata)
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
      combineLatestWith(getOrder([address, trancheId])),
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
      combineLatestWith(getOrder([address, trancheId])),
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

  function submitSolution(args: [poolId: string, solution: string[][]], options?: TransactionOptions) {
    const [poolId, solution] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.pools.submitSolution(poolId, solution)
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
        combineLatestWith(getOrder([address, trancheId])),
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
            (pool) => combineLatest(pool.tranches.map((t) => getOrder([address, t.id]))),
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
      take(1),
      switchMap(([api, loan]) => {
        // Calculate the debt an hour from now to have some margin
        const secondsPerHour = 60 * 60
        const debtWithMargin = loan?.outstandingDebt
          .toDecimal()
          .add(loan.normalizedDebt.toDecimal().mul(loan.interestRatePerSec.toDecimal().minus(1).mul(secondsPerHour)))
        const amount = Balance.fromFloat(debtWithMargin || 0).toString()
        const submittable = api.tx.utility.batchAll([
          api.tx.loans.repay(poolId, loanId, amount),
          api.tx.loans.close(poolId, loanId),
        ])
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
            api.events.pools.EpochExecuted.is(event)
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
        (api) => combineLatest([api.query.pools.pool.entries(), api.query.loans.poolNAV.entries()]),
        (api, [rawPools, rawNavs]) => ({ api, rawPools, rawNavs })
      ),
      switchMap(({ api, rawPools, rawNavs }) => {
        const navMap = rawNavs.reduce((acc, [key, navValue]) => {
          const poolId = formatPoolKey(key as StorageKey<[u32]>)
          const nav = navValue.toJSON() as unknown as NAVDetailsData
          acc[poolId] = {
            latest: nav ? nav.latest : '0',
            lastUpdated: nav ? nav.lastUpdated : 0,
          }
          return acc
        }, {} as Record<string, { latest: string; lastUpdated: number }>)

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
        const tranceIdToIssuanceIndex: Record<string, number> = {}
        keys.forEach(([, tid], i) => {
          tranceIdToIssuanceIndex[tid] = i
        })

        // modify keys for $issuance query [Tranche: [poolId, trancheId]]
        const issuanceKeys = keys.map(([poolId, trancheId]) => ({ Tranche: [poolId, trancheId] }))

        // Get the token prices via RPC
        const $prices = combineLatest(
          // @ts-expect-error
          pools.map((p) => api.rpc.pools.trancheTokenPrices(p.id).pipe(startWith(null))) as Observable<Codec[] | null>[]
        )

        const $issuance = api.query.ormlTokens.totalIssuance.multi(issuanceKeys).pipe(take(1))
        return combineLatest([$issuance, $prices]).pipe(
          map(([rawIssuances, rawPrices]) => {
            const mappedPools = pools.map((poolObj, poolIndex) => {
              const { data: pool, id: poolId, metadata } = poolObj
              const navData = navMap[poolId]
              const currency = getCurrency(pool.currency)
              const mappedPool: Pool = {
                id: poolId,
                createdAt: null,
                metadata,
                currency,
                tranches: pool.tranches.tranches.map((tranche, index) => {
                  const trancheId = pool.tranches.ids[index]
                  const issuanceIndex = tranceIdToIssuanceIndex[trancheId]

                  let minRiskBuffer: Perquintill | null = null
                  let interestRatePerSec: Rate | null = null
                  if ('nonResidual' in tranche.trancheType) {
                    minRiskBuffer = new Perquintill(hexToBN(tranche.trancheType.nonResidual.minRiskBuffer))
                    interestRatePerSec = new Rate(hexToBN(tranche.trancheType.nonResidual.interestRatePerSec))
                  }

                  const subordinateTranchesValue = pool.tranches.tranches
                    .slice(0, index)
                    .reduce((prev: Balance, tranche: TrancheDetailsData) => {
                      return new Balance(
                        prev.add(new Balance(hexToBN(tranche.debt))).add(new Balance(hexToBN(tranche.reserve)))
                      )
                    }, new Balance(0))
                  const poolValue = pool.tranches.tranches.reduce((prev: Balance, tranche: TrancheDetailsData) => {
                    return new Balance(
                      prev.add(new Balance(hexToBN(tranche.debt))).add(new Balance(hexToBN(tranche.reserve)))
                    )
                  }, new Balance(0))

                  const tokenPrice = rawPrices[poolIndex]?.[index].toJSON() as string

                  return {
                    id: trancheId,
                    index,
                    seniority: tranche.seniority,
                    tokenPrice: tokenPrice ? new Price(hexToBN(tokenPrice)) : null,
                    currency,
                    totalIssuance: new Balance(rawIssuances[issuanceIndex].toString()),
                    poolId,
                    poolMetadata: (metadata ?? undefined) as string | undefined,
                    interestRatePerSec,
                    minRiskBuffer,
                    currentRiskBuffer: subordinateTranchesValue.gtn(0)
                      ? new Perquintill(subordinateTranchesValue.div(poolValue))
                      : new Perquintill(0),
                    ratio: new Perquintill(hexToBN(tranche.ratio)),
                    outstandingInvestOrders: new Balance(hexToBN(tranche.outstandingInvestOrders)),
                    outstandingRedeemOrders: new Balance(hexToBN(tranche.outstandingRedeemOrders)),
                    lastUpdatedInterest: new Date(tranche.lastUpdatedInterest * 1000).toISOString(),
                    balance: new Balance(new Balance(hexToBN(tranche.debt)).add(new Balance(hexToBN(tranche.reserve)))),
                  }
                }),
                reserve: {
                  max: new Balance(hexToBN(pool.reserve.max)),
                  available: new Balance(hexToBN(pool.reserve.available)),
                  total: new Balance(hexToBN(pool.reserve.total)),
                },
                epoch: {
                  ...pool.epoch,
                  lastClosed: new Date(pool.epoch.lastClosed * 1000).toISOString(),
                },
                parameters: {
                  ...pool.parameters,
                },
                nav: {
                  latest: navData?.latest ? new Balance(hexToBN(navData.latest)) : new Balance(0),
                  lastUpdated: new Date((navData?.lastUpdated ?? 0) * 1000).toISOString(),
                },
                value: new Balance(
                  hexToBN(pool.reserve.total).add(new BN(navData?.latest ? hexToBN(navData.latest) : 0))
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
      switchMap(() =>
        combineLatest([$query]).pipe(
          switchMap(([queryData]) => {
            return [
              queryData?.poolSnapshots.nodes.map((state) => {
                const poolState = {
                  id: state.id,
                  netAssetValue: new Balance(state.netAssetValue),
                  totalReserve: new Balance(state.totalReserve),
                }
                const poolValue = new Balance(
                  new Balance(state?.netAssetValue || '0').add(new Balance(state?.totalReserve || '0'))
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
        (api) => combineLatest([api.query.ormlTokens.accounts.entries(address), api.query.system.account(address)]),
        (api, [rawBalances, nativeBalance]) => ({ api, rawBalances, nativeBalance })
      ),
      take(1),
      map(({ api, rawBalances, nativeBalance }) => {
        const balances = {
          tranches: [] as TrancheBalance[],
          currencies: [] as CurrencyBalance[],
          native: {
            balance: new BN((nativeBalance as any).data.free.toString()),
            decimals: api.registry.chainDecimals[0],
            symbol: api.registry.chainTokens[0],
          },
        }

        rawBalances.forEach(([rawKey, rawValue]) => {
          const key = (rawKey.toHuman() as any)[1] as string | { Tranche: [string, string] } | { Permissioned: string }
          const value = rawValue.toJSON() as { free: string | number }

          if (typeof key === 'string') {
            balances.currencies.push({
              currency: key.toLowerCase(),
              balance: new Balance(hexToBN(value.free)),
            })
          } else if ('Tranche' in key) {
            const [poolId, trancheId] = key.Tranche
            if (value.free !== 0) {
              balances.tranches.push({
                poolId: poolId.replace(/\D/g, ''),
                trancheId,
                balance: new Balance(hexToBN(value.free)),
              })
            }
          } else {
            if (value.free !== 0) {
              balances.currencies.push({
                currency: key.Permissioned.toLowerCase(),
                balance: new Balance(hexToBN(value.free)),
              })
            }
          }
        })

        return balances
      }),
      repeatWhen(() => $events)
    )
  }

  function getOrder(args: [address: Account, trancheId: string]) {
    const [address, trancheId] = args

    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => api.query.pools.order(trancheId, address)),
      map((result) => {
        const order = result.toJSON() as any

        if (!order) {
          return {
            invest: new Balance(0),
            redeem: new Balance(0),
            epoch: 0,
          }
        }

        return {
          invest: new Balance(hexToBN(order.invest)),
          redeem: new Balance(hexToBN(order.redeem)),
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
            api.events.loans.Borrowed.is(event)
        )
        return !!event
      })
    )

    return $api.pipe(
      switchMap(
        (api) => combineLatest([api.query.loans.activeLoans(poolId)]),
        (api, [activeLoanValues]) => ({ api, activeLoanValues })
      ),
      switchMap(({ api, activeLoanValues }) => {
        const activeLoanData = activeLoanValues.toJSON() as ActiveLoanDetilsData[]
        const interestAccrualKeys = activeLoanData.map((activeLoan) => hexToBN(activeLoan.interestRatePerSec))
        const $interestAccrual = api.query.interestAccrual.rate.multi(interestAccrualKeys).pipe(take(1))
        return combineLatest([
          api.query.loans.loan.entries(poolId),
          api.query.loans.activeLoans(poolId),
          api.query.loans.closedLoans.entries(poolId),
          $interestAccrual,
        ])
      }),
      map(([loanValues, activeLoanValues, closedLoansValues, interestAccrual]) => {
        const loans = (loanValues as any[]).map(([key, value]) => {
          const loan = value.toJSON() as unknown as LoanDetailsData
          const [collectionId, nftId] = loan.collateral
          const mapped: Loan = {
            id: formatLoanKey(key as StorageKey<[u32, u32]>),
            poolId,
            interestRatePerSec: new Rate(0),
            outstandingDebt: new Balance(0),
            normalizedDebt: new Balance(0),
            totalBorrowed: new Balance(0),
            totalRepaid: new Balance(0),
            lastUpdated: '',
            originationDate: '',
            status: getLoanStatus(loan),
            loanInfo: null,
            adminWrittenOff: null,
            writeOffStatus: null,
            asset: {
              collectionId: collectionId.toString(),
              nftId: nftId.toString(),
            },
          }
          return mapped
        })

        const activeLoanData = activeLoanValues.toJSON() as ActiveLoanDetilsData[]
        const activeLoans = activeLoanData.map((activeLoan, index) => {
          const interestData = interestAccrual[index].toJSON() as InterestAccrual
          const mapped: Omit<Loan, 'asset' | 'status'> = {
            id: String(activeLoan.loanId),
            poolId,
            interestRatePerSec: new Rate(hexToBN(activeLoan.interestRatePerSec)),
            outstandingDebt: getOutstandingDebt(activeLoan, interestData),
            normalizedDebt: new Balance(hexToBN(activeLoan.normalizedDebt)),
            totalBorrowed: new Balance(hexToBN(activeLoan.totalBorrowed)),
            totalRepaid: new Balance(hexToBN(activeLoan.totalRepaid)),
            lastUpdated: new Date(activeLoan.lastUpdated * 1000).toISOString(),
            originationDate: new Date(activeLoan.originationDate * 1000).toISOString(),
            loanInfo: getLoanInfo(activeLoan.loanType),
            adminWrittenOff: activeLoan.adminWrittenOff,
            writeOffStatus: activeLoan.writeOffStatus,
          }
          return mapped
        })

        const closedLoans = (closedLoansValues as any[]).map(([key, value]) => {
          const closedLoan = value.toJSON() as ClosedLoanDetilsData
          const mapped: Omit<Loan, 'asset' | 'status' | 'adminWrittenOff'> = {
            id: formatLoanKey(key as StorageKey<[u32, u32]>),
            poolId,
            interestRatePerSec: new Rate(hexToBN(closedLoan.interestRatePerSec)),
            outstandingDebt: new Balance(0),
            normalizedDebt: new Balance(hexToBN(closedLoan.normalizedDebt)),
            totalBorrowed: new Balance(hexToBN(closedLoan.totalBorrowed)),
            totalRepaid: new Balance(hexToBN(closedLoan.totalRepaid)),
            lastUpdated: new Date(closedLoan.lastUpdated * 1000).toISOString(),
            originationDate: new Date(closedLoan.originationDate * 1000).toISOString(),
            loanInfo: getLoanInfo(closedLoan.loanType),
            writeOffStatus: closedLoan.writeOffStatus,
          }
          return mapped
        })

        // combine loan status and collateral from loans.loan() with active/closedLoan data
        const mergedLoans = [...loans, ...activeLoans, ...closedLoans].reduce<any[]>((prev, curr) => {
          const loanExists = prev.some((loan) => loan.id === curr.id)
          if (loanExists) {
            return prev.map((loan) => {
              if (String(loan.id) === String(curr.id)) {
                return { ...loan, ...curr }
              }
              return loan
            })
          }

          return [...prev, curr]
        }, []) as Loan[]
        return mergedLoans
      }),
      repeatWhen(() => $events)
    )
  }

  function getPendingCollect(args: [address: Account, poolId: string, trancheId: string, executedEpoch: number]) {
    const [address, , trancheId, executedEpoch] = args
    const $api = inst.getApi()

    return $api.pipe(
      combineLatestWith(getOrder([address, trancheId])),
      switchMap(([api, order]) => {
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
                investCurrency: new Balance(order.invest),
                redeemToken: new Balance(order.redeem),
                epoch: order.epoch,
                payoutCurrencyAmount: new Balance(payoutCurrencyAmount),
                payoutTokenAmount: new Balance(payoutTokenAmount),
                remainingInvestCurrency: new Balance(remainingInvestCurrency),
                remainingRedeemToken: new Balance(remainingRedeemToken),
              }
            })
          )
        }
        return of({
          investCurrency: new Balance(order.invest),
          redeemToken: new Balance(order.redeem),
          epoch: order.epoch,
          payoutCurrencyAmount: new Balance(0),
          payoutTokenAmount: new Balance(0),
          remainingInvestCurrency: new Balance(order.invest),
          remainingRedeemToken: new Balance(order.redeem),
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

  function addWriteOffGroup(args: [poolId: string, percentage: BN, overdueDays: number], options?: TransactionOptions) {
    const [poolId, percentage, overdueDays] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.loans.addWriteOffGroup(poolId, [percentage.toString(), overdueDays])
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
    getPools,
    getPool,
    getBalances,
    getOrder,
    getLoans,
    getLoan,
    getPendingCollect,
    addWriteOffGroup,
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

function getLoanInfo(loanType: LoanInfoData): LoanInfo {
  if (loanType.bulletLoan) {
    return {
      type: 'BulletLoan',
      advanceRate: new Rate(hexToBN(loanType.bulletLoan.advanceRate)),
      probabilityOfDefault: new Rate(hexToBN(loanType.bulletLoan.probabilityOfDefault)),
      lossGivenDefault: new Rate(hexToBN(loanType.bulletLoan.lossGivenDefault)),
      value: new Balance(hexToBN(loanType.bulletLoan.value)),
      discountRate: new Rate(hexToBN(loanType.bulletLoan.discountRate)),
      maturityDate: new Date(loanType.bulletLoan.maturityDate * 1000).toISOString(),
    }
  }
  if (loanType.creditLine) {
    return {
      type: 'CreditLine',
      advanceRate: new Rate(hexToBN(loanType.creditLine.advanceRate)),
      value: new Balance(hexToBN(loanType.creditLine.value)),
    }
  }
  if (loanType.creditLineWithMaturity) {
    return {
      type: 'CreditLineWithMaturity',
      advanceRate: new Rate(hexToBN(loanType.creditLineWithMaturity.advanceRate)),
      probabilityOfDefault: new Rate(hexToBN(loanType.creditLineWithMaturity.probabilityOfDefault)),
      value: new Balance(hexToBN(loanType.creditLineWithMaturity.value)),
      discountRate: new Rate(hexToBN(loanType.creditLineWithMaturity.discountRate)),
      maturityDate: new Date(loanType.creditLineWithMaturity.maturityDate * 1000).toISOString(),
      lossGivenDefault: new Rate(hexToBN(loanType.creditLineWithMaturity.lossGivenDefault)),
    }
  }

  throw new Error(`Unrecognized loan info: ${JSON.stringify(loanType)}`)
}

function getOutstandingDebt(loan: ActiveLoanDetilsData, interestAccrual: InterestAccrual) {
  const accRate = new Rate(hexToBN(interestAccrual.accumulatedRate)).toDecimal()
  const rate = new Rate(hexToBN(loan.interestRatePerSec)).toDecimal()
  const normalizedDebt = new Balance(hexToBN(loan.normalizedDebt)).toDecimal()
  const secondsSinceUpdated = Date.now() / 1000 - interestAccrual.lastUpdated

  const debtFromAccRate = normalizedDebt.mul(accRate)
  const debtSinceUpdated = normalizedDebt.mul(rate.minus(1).mul(secondsSinceUpdated))
  const debt = debtFromAccRate.add(debtSinceUpdated)

  return Balance.fromFloat(debt)
}

const getLoanStatus = (loanValue: LoanDetailsData) => {
  const status = Object.keys(loanValue.status)[0]
  return `${status.charAt(0).toUpperCase()}${status.slice(1)}` as LoanStatus
}
