import { StorageKey, u32 } from '@polkadot/types'
import BN from 'bn.js'
import { combineLatest, EMPTY, expand, firstValueFrom, of } from 'rxjs'
import { combineLatestWith, filter, map, repeatWhen, switchMap, take } from 'rxjs/operators'
import { CentrifugeBase } from '../CentrifugeBase'
import { Account, TransactionOptions } from '../types'
import { SubqueryDailyPoolState } from '../types/subquery'
import { getRandomUint, isSameAddress } from '../utils'
import { Balance, Perquintill, Price, Rate } from '../utils/BN'

const PerquintillBN = new BN(10).pow(new BN(18))
const PriceBN = new BN(10).pow(new BN(27))

const LoanPalletAccountId = '0x6d6f646c70616c2f6c6f616e0000000000000000000000000000000000000000'

type AdminRole = 'PoolAdmin' | 'Borrower' | 'PricingAdmin' | 'LiquidityAdmin' | 'MemberListAdmin' | 'RiskAdmin'

type CurrencyRole = 'PermissionedAssetManager' | 'PermissionedAssetIssuer'

export type PoolRoleInput = AdminRole | { TrancheInvestor: [trancheId: string, permissionedTill: number] }

export type Currency = string

const AdminRoleBits = {
  PoolAdmin: 0b00000001,
  Borrower: 0b00000010,
  PricingAdmin: 0b00000100,
  LiquidityAdmin: 0b00001000,
  MemberListAdmin: 0b00010000,
  RiskAdmin: 0b00100000,
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

type LoanInfo = BulletLoan | CreditLine | CreditLineWithMaturity

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
  debt: Balance
  reserve: Balance
  minRiskBuffer: Perquintill | null
  interestRatePerSec: Rate | null
  ratio: Perquintill
  outstandingInvestOrders: Balance
  outstandingRedeemOrders: Balance
  lastUpdatedInterest: string
}

export type TrancheWithTokenPrice = Tranche & {
  totalIssuance: Balance
  tokenPrice: Price
}

export type Pool = {
  id: string
  currency: Currency
  metadata?: string
  value: Balance
  tranches: Tranche[]
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

export type DetailedPool = Omit<Pool, 'tranches'> & {
  createdAt: string | null
  tranches: TrancheWithTokenPrice[]
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

type LoanDetailsData = {
  interestRatePerSec: string
  accumulatedRate: string
  principalDebt: string
  lastUpdated: number
  originationDate: number
  status: LoanStatus
  loanType: { [key: string]: LoanInfoData }
  adminWrittenOff: boolean
  writeOffIndex: number | null
  collateral: [string, string]
  totalBorrowed: string
  totalRepaid: string
}

export type Loan = {
  id: string
  poolId: string
  interestRatePerSec: Rate
  outstandingDebt: Balance
  principalDebt: Balance
  totalBorrowed: Balance
  totalRepaid: Balance
  lastUpdated: string
  originationDate: string
  status: LoanStatus
  loanInfo: LoanInfo
  adminWrittenOff: boolean
  writeOffIndex: number | null
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
                PoolRole: 'RiskAdmin',
              }
            ),
            api.tx.loans.initialisePool(poolId, collectionId),
          ].concat(
            writeOffGroups.map((g) => api.tx.loans.addWriteOffGroup(poolId, [g.percentage.toString(), g.overdueDays]))
          )
        )
        return inst.wrapSignAndSendRx(api, submittable, options)
      })
    )
  }

  function updatePool(
    args: [poolId: string, minEpochTime: number, challengeTime: number, maxNavAge: number],
    options?: TransactionOptions
  ) {
    const [poolId, minEpochTime, challengeTime, maxNavAge] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.pools.update(poolId, minEpochTime, challengeTime, maxNavAge)
        return inst.wrapSignAndSendRx(api, submittable, options)
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
        return inst.wrapSignAndSendRx(api, submittable, options)
      })
    )
  }

  function setMaxReserve(args: [poolId: string, maxReserve: BN], options?: TransactionOptions) {
    const [poolId, maxReserve] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.pools.setMaxReserve(poolId, maxReserve.toString())
        return inst.wrapSignAndSendRx(api, submittable, options)
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
        return inst.wrapSignAndSendRx(api, submittable, options)
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
        return inst.wrapSignAndSendRx(api, submittable, options)
      })
    )
  }

  function closeEpoch(args: [poolId: string], options?: TransactionOptions) {
    const [poolId] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.utility.batchAll([api.tx.loans.updateNav(poolId), api.tx.pools.closeEpoch(poolId)])
        return inst.wrapSignAndSendRx(api, submittable, options)
      })
    )
  }

  function submitSolution(args: [poolId: string, solution: string[][]], options?: TransactionOptions) {
    const [poolId, solution] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.pools.submitSolution(poolId, solution)
        return inst.wrapSignAndSendRx(api, submittable, options)
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
          return inst.wrapSignAndSendRx(api, submittable, options)
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

        return inst.wrapSignAndSendRx(api, submittable, options)
      })
    )
  }

  function getUserPermissions(args: [address: Account]) {
    const [address] = args
    const $api = inst.getApi()

    const $events = inst.getBlockEvents().pipe(
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
                ['PoolAdmin', 'Borrower', 'PricingAdmin', 'LiquidityAdmin', 'MemberListAdmin', 'RiskAdmin'] as const
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

    const $events = inst.getBlockEvents().pipe(
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
                  ['PoolAdmin', 'Borrower', 'PricingAdmin', 'LiquidityAdmin', 'MemberListAdmin', 'RiskAdmin'] as const
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

  async function getNextLoanId() {
    const $api = inst.getApi()

    const id = await firstValueFrom($api.pipe(switchMap((api) => api.query.loans.nextLoanId()))).toString()
    return id
  }

  function createLoan(args: [poolId: string, collectionId: string, nftId: string], options?: TransactionOptions) {
    const [poolId, collectionId, nftId] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.loans.create(poolId, [collectionId, nftId])
        return inst.wrapSignAndSendRx(api, submittable, options)
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
        return inst.wrapSignAndSendRx(api, submittable, options)
      })
    )
  }

  function financeLoan(args: [poolId: string, loanId: string, amount: BN], options?: TransactionOptions) {
    const [poolId, loanId, amount] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.loans.borrow(poolId, loanId, amount.toString())
        return inst.wrapSignAndSendRx(api, submittable, options)
      })
    )
  }

  function repayLoanPartially(args: [poolId: string, loanId: string, amount: BN], options?: TransactionOptions) {
    const [poolId, loanId, amount] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.loans.repay(poolId, loanId, amount.toString())
        return inst.wrapSignAndSendRx(api, submittable, options)
      })
    )
  }

  function repayAndCloseLoan(args: [poolId: string, loanId: string], options?: TransactionOptions) {
    const [poolId, loanId] = args
    const $api = inst.getApi()

    return $api.pipe(
      combineLatestWith(getLoan([poolId, loanId])),
      switchMap(([api, loan]) => {
        // Calculate the debt an hour from now to have some margin
        const secondsPerHour = 60 * 60
        const debtWithMargin = loan.outstandingDebt
          .toDecimal()
          .add(loan.principalDebt.toDecimal().mul(loan.interestRatePerSec.toDecimal().minus(1).mul(secondsPerHour)))
        const amount = Balance.fromFloat(debtWithMargin).toString()
        const submittable = api.tx.utility.batchAll([
          api.tx.loans.repay(poolId, loanId, amount),
          api.tx.loans.close(poolId, loanId),
        ])
        return inst.wrapSignAndSendRx(api, submittable, options)
      })
    )
  }

  function getPools() {
    const $api = inst.getApi()

    const $events = $api.pipe(
      switchMap(
        (api) => combineLatest([api.query.system.events(), api.query.system.number()]),
        (api, [events]) => ({ api, events })
      ),
      filter(({ api, events }) => {
        // @ts-expect-error
        const event = events.find(({ event }) => api.events.pools.Created.is(event))
        return !!event
      })
    )

    return $api.pipe(
      switchMap((api) => combineLatest([api.query.pools.pool.entries(), api.query.loans.poolNAV.entries()])),
      map(([rawPools, rawNavs]) => {
        const navMap = rawNavs.reduce((acc, [key, navValue]) => {
          const poolId = formatPoolKey(key as StorageKey<[u32]>)
          const nav = navValue.toJSON() as unknown as NAVDetailsData
          acc[poolId] = {
            latest: nav ? nav.latest : '0',
            lastUpdated: nav ? nav.lastUpdated : 0,
          }
          return acc
        }, {} as Record<string, { latest: string; lastUpdated: number }>)

        const pools = rawPools.map(([key, value]) => {
          const pool = value.toJSON() as unknown as PoolDetailsData
          const metadata = (value.toHuman() as any).metadata
          const poolId = formatPoolKey(key as StorageKey<[u32]>)
          const navData = navMap[poolId]
          const mapped: Pool = {
            id: poolId,
            metadata,
            currency: getCurrency(pool.currency),
            tranches: pool.tranches.tranches.map((tranche, index) => {
              let minRiskBuffer: Perquintill | null = null
              let interestRatePerSec: Rate | null = null
              if ('nonResidual' in tranche.trancheType) {
                minRiskBuffer = new Perquintill(hexToBN(tranche.trancheType.nonResidual.minRiskBuffer))
                interestRatePerSec = new Rate(hexToBN(tranche.trancheType.nonResidual.interestRatePerSec))
              }
              return {
                index,
                id: pool.tranches.ids[index],
                seniority: tranche.seniority,
                debt: new Balance(hexToBN(tranche.debt)),
                reserve: new Balance(hexToBN(tranche.reserve)),
                minRiskBuffer,
                interestRatePerSec,
                ratio: new Perquintill(hexToBN(tranche.ratio)),
                outstandingInvestOrders: new Balance(hexToBN(tranche.outstandingInvestOrders)),
                outstandingRedeemOrders: new Balance(hexToBN(tranche.outstandingRedeemOrders)),
                lastUpdatedInterest: new Date(tranche.lastUpdatedInterest * 1000).toISOString(),
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
            value: new Balance(hexToBN(pool.reserve.total).add(new BN(navData?.latest ? hexToBN(navData.latest) : 0))),
          }

          return mapped
        })

        return pools
      }),
      repeatWhen(() => $events)
    )
  }

  function getTokens() {
    const $api = inst.getApi()

    return $api.pipe(
      switchMap(
        (api) => api.query.pools.pool.entries(),
        (api, pools) => ({ api, pools })
      ),
      switchMap(({ api, pools: rawPools }) => {
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
        // array of args for $epoch query (by trancheId and epoch)
        const epochKeys = keys.map((k) => k.slice(1))
        // modify keys for $issuance query [Tranche: [poolId, trancheId]]
        const issuanceKeys = keys.map(([poolId, trancheId]) => ({ Tranche: [poolId, trancheId] }))

        const $epochs = api.query.pools.epoch.multi(epochKeys)
        const $issuance = api.query.ormlTokens.totalIssuance.multi(issuanceKeys)

        // emit changes from $epochs and $issuance to construct final array of tokens
        return combineLatest([$epochs, $issuance]).pipe(
          map(([rawEpochs, rawIssuances]) => {
            const epochs = rawEpochs.map((value) => (!value.isEmpty ? (value as any).toJSON() : null))

            return epochs.map((epoch, epochIndex) => {
              const [poolId, trancheId] = keys[epochIndex]
              const pool = pools?.find(({ id }) => id === poolId)
              const trancheIndex = pool!.data?.tranches.ids.findIndex((id) => id === trancheId)
              const tranche = pool!.data?.tranches.tranches.find((_, tIndex) => trancheIndex === tIndex)!

              let minRiskBuffer: Perquintill | null = null
              let interestRatePerSec: Rate | null = null
              if ('nonResidual' in tranche.trancheType) {
                minRiskBuffer = new Perquintill(hexToBN(tranche.trancheType.nonResidual.minRiskBuffer))
                interestRatePerSec = new Rate(hexToBN(tranche.trancheType.nonResidual.interestRatePerSec))
              }

              return {
                id: trancheId,
                index: trancheIndex,
                seniority: tranche.seniority,
                tokenPrice: epoch ? new Price(hexToBN(epoch.tokenPrice)) : Price.fromFloat(1),
                currency: getCurrency(pool!.data.currency),
                tokenIssuance: new Balance(rawIssuances[epochIndex].toString()),
                poolId,
                poolMetadata: (pool!.metadata ?? undefined) as string | undefined,
                interestRatePerSec,
                minRiskBuffer,
                ratio: new Perquintill(hexToBN(tranche.ratio)),
              }
            })
          })
        )
      })
    )
  }

  function getPool(args: [poolId: string]) {
    const [poolId] = args
    const $api = inst.getApi()

    const $query = inst.getOptionalSubqueryObservable<{ pool: { createdAt: string } }>(
      `query($poolId: String!) {
        pool(id: $poolId) {
          createdAt
        }
      }`,
      {
        poolId,
      }
    )

    return $api.pipe(
      switchMap((api) =>
        combineLatest([api.query.pools.pool(poolId), api.query.loans.poolNAV(poolId), $query]).pipe(
          switchMap(([poolValue, navValue, queryData]) => {
            const pool = poolValue.toJSON() as unknown as PoolDetailsData
            const nav = navValue.toJSON() as unknown as NAVDetailsData
            const createdAt = queryData?.pool?.createdAt ?? null
            const metadata = (poolValue.toHuman() as any).metadata

            const { ids } = pool.tranches

            // @ts-expect-error
            const $multi = api.queryMulti([
              ...ids.map((id) => [api.query.ormlTokens.totalIssuance, { tranche: [poolId, id] }]),
              ...ids.map((id) => [api.query.pools.epoch, [id, pool.epoch.lastExecuted]]),
            ])

            return $multi.pipe(
              map((multi) => {
                const numTranches = multi.length / 2
                const tokenIssuanceValues = multi.slice(0, numTranches)
                const epochValues = multi.slice(numTranches)
                const lastEpoch = epochValues.map((val) => (!val.isEmpty ? (val as any).unwrap() : null))

                const detailedPool: DetailedPool = {
                  id: poolId,
                  createdAt,
                  metadata,
                  currency: getCurrency(pool.currency),
                  tranches: pool.tranches.tranches.map((tranche, index) => {
                    let minRiskBuffer: Perquintill | null = null
                    let interestRatePerSec: Rate | null = null
                    if ('nonResidual' in tranche.trancheType) {
                      minRiskBuffer = new Perquintill(hexToBN(tranche.trancheType.nonResidual.minRiskBuffer))
                      interestRatePerSec = new Rate(hexToBN(tranche.trancheType.nonResidual.interestRatePerSec))
                    }
                    return {
                      index,
                      id: pool.tranches.ids[index],
                      seniority: tranche.seniority,
                      debt: new Balance(hexToBN(tranche.debt)),
                      reserve: new Balance(hexToBN(tranche.reserve)),
                      minRiskBuffer,
                      interestRatePerSec,
                      ratio: new Perquintill(hexToBN(tranche.ratio)),
                      outstandingInvestOrders: new Balance(hexToBN(tranche.outstandingInvestOrders)),
                      outstandingRedeemOrders: new Balance(hexToBN(tranche.outstandingRedeemOrders)),
                      lastUpdatedInterest: new Date(tranche.lastUpdatedInterest * 1000).toISOString(),
                      totalIssuance: new Balance(tokenIssuanceValues[index].toString()),
                      tokenPrice: new Price(lastEpoch[index]?.tokenPrice.toString() ?? '0'),
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
                    latest: nav?.latest ? new Balance(hexToBN(nav.latest)) : new Balance(0),
                    lastUpdated: new Date((nav?.lastUpdated ?? 0) * 1000).toISOString(),
                  },
                  value: new Balance(hexToBN(pool.reserve.total).add(new BN(nav?.latest ? hexToBN(nav.latest) : 0))),
                }
                return detailedPool
              })
            )
          })
        )
      )
    )
  }

  function getDailyPoolStates(args: [poolId: string]) {
    const [poolId] = args
    const $api = inst.getApi()

    const $query = inst.getOptionalSubqueryObservable<{ dailyPoolStates: { nodes: SubqueryDailyPoolState[] } }>(
      `query($poolId: String!) {
        dailyPoolStates(filter: {id:{startsWith: $poolId}}) {
          nodes {
            timestamp
            poolState {
              id
              totalReserve
              netAssetValue
            }
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
              queryData?.dailyPoolStates.nodes.map((state) => {
                const poolState = {
                  ...state.poolState,
                  netAssetValue: new Balance(state.poolState.netAssetValue),
                }
                const poolValue = new Balance(
                  new Balance(state?.poolState.netAssetValue || '0').add(
                    new Balance(state?.poolState.totalReserve || '0')
                  )
                )
                return { ...state, poolState, poolValue }
              }) as unknown as DailyPoolState[],
            ]
          })
        )
      )
    )
  }

  function getBalances(args: [address: Account]) {
    const [address] = args
    const $api = inst.getApi()

    const $events = inst.getBlockEvents()

    return $api.pipe(
      switchMap(
        (api) => combineLatest([api.query.ormlTokens.accounts.entries(address), api.query.system.account(address)]),
        (api, [rawBalances, nativeBalance]) => ({ api, rawBalances, nativeBalance })
      ),
      map(({ api, rawBalances, nativeBalance }) => {
        const balances = {
          tranches: [] as TrancheBalance[],
          currencies: [] as CurrencyBalance[],
          native: {
            balance: new BN((nativeBalance as any).data.free.toString()),
            decimals: api.registry.chainDecimals[0],
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

    const $events = inst.getBlockEvents().pipe(
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
      switchMap((api) => api.query.loans.loan.entries(poolId)),
      map((loanValues) => {
        return loanValues.map(([key, value]) => {
          const loan = value.toJSON() as unknown as LoanDetailsData
          const assetKey = (value.toHuman() as unknown as LoanDetailsData).collateral
          const mapped: Loan = {
            id: formatLoanKey(key as StorageKey<[u32, u32]>),
            poolId,
            interestRatePerSec: new Rate(hexToBN(loan.interestRatePerSec)),
            outstandingDebt: getOutstandingDebt(loan),
            principalDebt: new Balance(hexToBN(loan.principalDebt)),
            totalBorrowed: new Balance(hexToBN(loan.totalBorrowed)),
            totalRepaid: new Balance(hexToBN(loan.totalRepaid)),
            lastUpdated: new Date(loan.lastUpdated * 1000).toISOString(),
            originationDate: new Date(loan.originationDate * 1000).toISOString(),
            status: loan.status,
            loanInfo: getLoanInfo(loan.loanType),
            adminWrittenOff: loan.adminWrittenOff,
            writeOffIndex: loan.writeOffIndex,
            asset: {
              collectionId: assetKey[0].replace(/\D/g, ''),
              nftId: assetKey[1].replace(/\D/g, ''),
            },
          }
          return mapped
        })
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
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => api.query.loans.loan(poolId, loanId)),
      map((loanData) => {
        const loanValue = loanData.toJSON() as unknown as LoanDetailsData
        const assetKey = (loanData.toHuman() as unknown as LoanDetailsData).collateral

        const loan: Loan = {
          id: loanId,
          poolId,
          interestRatePerSec: new Rate(hexToBN(loanValue.interestRatePerSec)),
          outstandingDebt: getOutstandingDebt(loanValue),
          principalDebt: new Balance(hexToBN(loanValue.principalDebt)),
          totalBorrowed: new Balance(hexToBN(loanValue.totalBorrowed)),
          totalRepaid: new Balance(hexToBN(loanValue.totalRepaid)),
          lastUpdated: new Date(loanValue.lastUpdated * 1000).toISOString(),
          originationDate: new Date(loanValue.originationDate * 1000).toISOString(),
          status: loanValue.status,
          loanInfo: getLoanInfo(loanValue.loanType),
          adminWrittenOff: loanValue.adminWrittenOff,
          writeOffIndex: loanValue.writeOffIndex,
          asset: {
            collectionId: assetKey[0].replace(/\D/g, ''),
            nftId: assetKey[1].replace(/\D/g, ''),
          },
        }
        return loan
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
        return inst.wrapSignAndSendRx(api, submittable, options)
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
        return inst.wrapSignAndSendRx(api, submittable, options)
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
    getTokens,
    getAvailablePoolId,
    getDailyPoolStates,
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

function getOutstandingDebt(loan: LoanDetailsData) {
  const accRate = new Rate(hexToBN(loan.accumulatedRate)).toDecimal()
  const rate = new Rate(hexToBN(loan.interestRatePerSec)).toDecimal()
  const principalDebt = new Balance(hexToBN(loan.principalDebt)).toDecimal()
  const secondsSinceUpdated = Date.now() / 1000 - loan.lastUpdated

  const debtFromAccRate = principalDebt.mul(accRate)
  const debtSinceUpdated = principalDebt.mul(rate.minus(1).mul(secondsSinceUpdated))
  const debt = debtFromAccRate.add(debtSinceUpdated)

  return Balance.fromFloat(debt)
}
