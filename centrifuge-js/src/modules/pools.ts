import { StorageKey, u32 } from '@polkadot/types'
import BN from 'bn.js'
import { combineLatest, firstValueFrom } from 'rxjs'
import { combineLatestWith, filter, map, repeatWhen, switchMap, take } from 'rxjs/operators'
import { isSameAddress } from '..'
import { CentrifugeBase } from '../CentrifugeBase'
import { Account, TransactionOptions } from '../types'

const Currency = new BN(10).pow(new BN(18))

const LoanPalletAccountId = '0x6d6f646c70616c2f6c6f616e0000000000000000000000000000000000000000'

type AdminRole = 'PoolAdmin' | 'Borrower' | 'PricingAdmin' | 'LiquidityAdmin' | 'MemberListAdmin' | 'RiskAdmin'

export type PoolRoleInput = AdminRole | { TrancheInvestor: [trancheId: number, delta: number] }

const AdminRoleBits = {
  PoolAdmin: 0b00000001,
  Borrower: 0b00000010,
  PricingAdmin: 0b00000100,
  LiquidityAdmin: 0b00001000,
  MemberListAdmin: 0b00010000,
  RiskAdmin: 0b00100000,
}

export type PoolRoles = {
  roles: AdminRole[]
  tranches: number[]
}

export type LoanInfoInput = {
  BulletLoan: [string, string, string, string, string, string]
  CreditLine: [string, string]
  CreditLineWithMaturity: [string, string, string, string, string, string]
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
  advanceRate: string
  probabilityOfDefault: string
  lossGivenDefault: string
  value: string
  discountRate: string
  maturityDate: number
}

type CreditLine = {
  type: 'CreditLine'
  advanceRate: string
  value: string
}

type CreditLineWithMaturity = {
  type: 'CreditLineWithMaturity'
  advanceRate: string
  probabilityOfDefault: string
  value: string
  discountRate: string
  maturityDate: number
  lossGivenDefault: string
}

type LoanInfo = BulletLoan | CreditLine | CreditLineWithMaturity

type TrancheDetailsData = {
  debt: BN
  reserve: BN
  minRiskBuffer: BN
  outstandingInvestOrders: BN
  outstandingRedeemOrders: BN
  ratio: BN
  interestPerSec: BN
  lastUpdatedInterest: number
}

type PoolDetailsData = {
  owner: string
  currency: { [key: string]: null }
  tranches: TrancheDetailsData[]
  currentEpoch: number
  lastEpochClosed: number
  lastEpochExecuted: number
  submissionPeriodEpoch: number | null
  maxReserve: BN
  availableReserve: BN
  totalReserve: BN
  metadata: string
}

type NAVDetailsData = {
  latestNav: BN
  lastUpdated: number
}

export type Tranche = {
  index: number
  name: string
  debt: string
  reserve: string
  minRiskBuffer: string
  ratio: string
  outstandingInvestOrders: string
  outstandingRedeemOrders: string
  interestPerSec: string
  lastUpdatedInterest: number
}

export type TrancheWithTokenPrice = Tranche & {
  totalIssuance: string
  tokenPrice: string
}

export type Pool = {
  id: string
  owner: string
  currency: string
  metadata: string
  tranches: Tranche[]
  reserve: {
    max: string
    available: string
    total: string
  }
  epoch: {
    current: number
    lastClosed: number
    lastExecuted: number
    inSubmissionPeriod: number | null
  }
  nav: {
    latest: string
    lastUpdated: number
  }
  value: string
}

export type DetailedPool = Omit<Pool, 'tranches'> & {
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
  borrowedAmount: BN
  ratePerSec: BN
  accumulatedRate: BN
  principalDebt: BN
  lastUpdated: number
  originationDate: number
  status: LoanStatus
  loanType: { [key: string]: LoanInfoData }
  adminWrittenOff: boolean
  writeOffIndex: number | null
  asset: [BN, BN]
}

export type Loan = {
  id: string
  poolId: string
  financedAmount: string
  financingFee: string
  outstandingDebt: string
  lastUpdated: number
  originationDate: number
  status: LoanStatus
  loanInfo: LoanInfo
  adminWrittenOff: boolean
  writeOffIndex: number | null
  asset: {
    collectionId: string
    nftId: string
  }
}

export type TokenBalance = {
  currency: string
  balance: string
}

export type TrancheBalance = {
  poolId: string
  trancheId: number
  balance: string
}

export type TrancheInput = {
  interestPerSec?: string
  minRiskBuffer?: string
  seniority?: number
}

const formatPoolKey = (keys: StorageKey<[u32]>) => (keys.toHuman() as string[])[0].replace(/\D/g, '')
const formatLoanKey = (keys: StorageKey<[u32, u32]>) => (keys.toHuman() as string[])[1].replace(/\D/g, '')

export function getPoolsModule(inst: CentrifugeBase) {
  function createPool(
    args: [
      poolId: string,
      collectionId: string,
      tranches: TrancheInput[],
      currency: string,
      maxReserve: BN,
      metadata: string
    ],
    options?: TransactionOptions
  ) {
    const [poolId, collectionId, tranches, currency, maxReserve, metadata] = args

    const $api = inst.getRxApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.utility.batchAll([
          api.tx.uniques.create(collectionId, LoanPalletAccountId),
          api.tx.pools.create(poolId, tranches, currency, maxReserve.toString()),
          api.tx.pools.setMetadata(poolId, metadata),
          api.tx.loans.initialisePool(poolId, collectionId),
        ])
        return inst.wrapSignAndSendRx(api, submittable, options)
      })
    )
  }

  function updatePool(
    args: [poolId: string, minEpochTime: BN, challengeTime: BN, maxNavAge: BN],
    options?: TransactionOptions
  ) {
    const [poolId, minEpochTime, challengeTime, maxNavAge] = args
    const $api = inst.getRxApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.pools.update(
          poolId,
          minEpochTime.toString(),
          challengeTime.toString(),
          maxNavAge.toString()
        )
        return inst.wrapSignAndSendRx(api, submittable, options)
      })
    )
  }

  function setMaxReserve(args: [poolId: string, maxReserve: BN], options?: TransactionOptions) {
    const [poolId, maxReserve] = args
    const $api = inst.getRxApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.pools.setMaxReserve(poolId, maxReserve.toString())
        return inst.wrapSignAndSendRx(api, submittable, options)
      })
    )
  }

  function updateInvestOrder(args: [poolId: string, trancheId: number, newOrder: BN], options?: TransactionOptions) {
    const [poolId, trancheId, newOrder] = args

    const address = inst.getSignerAddress()
    const $api = inst.getRxApi()

    return $api.pipe(
      combineLatestWith(getPool([poolId])),
      combineLatestWith(getOrder([address, poolId, trancheId])),
      switchMap(([[api, pool], order]) => {
        let submittable
        if (
          order.epoch <= pool.epoch.lastExecuted &&
          order.epoch > 0 &&
          (order.invest !== '0' || order.redeem !== '0')
        ) {
          submittable = api.tx.utility.batchAll([
            api.tx.pools.collect(poolId, trancheId, pool.epoch.lastExecuted + 1 - order.epoch),
            api.tx.pools.updateInvestOrder(poolId, trancheId, newOrder.toString()),
          ])
        } else {
          submittable = api.tx.pools.updateInvestOrder(poolId, trancheId, newOrder.toString())
        }
        return inst.wrapSignAndSendRx(api, submittable, options)
      })
    )
  }

  function updateRedeemOrder(args: [poolId: string, trancheId: number, newOrder: BN], options?: TransactionOptions) {
    const [poolId, trancheId, newOrder] = args
    const address = inst.getSignerAddress()
    const $api = inst.getRxApi()

    return $api.pipe(
      combineLatestWith(getPool([poolId])),
      combineLatestWith(getOrder([address, poolId, trancheId])),
      switchMap(([[api, pool], order]) => {
        let submittable
        if (
          order.epoch <= pool.epoch.lastExecuted &&
          order.epoch > 0 &&
          (order.invest !== '0' || order.redeem !== '0')
        ) {
          submittable = api.tx.utility.batchAll([
            api.tx.pools.collect(poolId, trancheId, pool.epoch.lastExecuted + 1 - order.epoch),
            api.tx.pools.updateRedeemOrder(poolId, trancheId, newOrder.toString()),
          ])
        } else {
          submittable = api.tx.pools.updateRedeemOrder(poolId, trancheId, newOrder.toString())
        }
        return inst.wrapSignAndSendRx(api, submittable, options)
      })
    )
  }

  function closeEpoch(args: [poolId: string], options?: TransactionOptions) {
    const [poolId] = args
    const $api = inst.getRxApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.utility.batchAll([api.tx.loans.updateNav(poolId), api.tx.pools.closeEpoch(poolId)])
        return inst.wrapSignAndSendRx(api, submittable, options)
      })
    )
  }

  function submitSolution(args: [poolId: string, solution: string[][]], options?: TransactionOptions) {
    const [poolId, solution] = args
    const $api = inst.getRxApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.pools.submitSolution(poolId, solution)
        return inst.wrapSignAndSendRx(api, submittable, options)
      })
    )
  }

  function collect(args: [poolId: string, trancheId?: number], options?: TransactionOptions) {
    const [poolId, trancheId] = args
    const $api = inst.getRxApi()
    const address = inst.getSignerAddress()

    if (trancheId !== undefined) {
      return $api.pipe(
        combineLatestWith(getPool([poolId])),
        combineLatestWith(getOrder([address, poolId, trancheId])),
        switchMap(([[api, pool], order]) => {
          const submittable = api.tx.pools.collect(poolId, trancheId, pool.epoch.lastExecuted + 1 - order.epoch)
          return inst.wrapSignAndSendRx(api, submittable, options)
        })
      )
    }

    return $api.pipe(
      combineLatestWith(
        getPool([poolId]).pipe(
          switchMap(
            (pool) => combineLatest(pool.tranches.map((_t, index: number) => getOrder([address, poolId, index]))),
            (pool, orders) => ({
              pool,
              orders,
            })
          )
        )
      ),
      switchMap(([api, { pool, orders }]) => {
        const submittable = api.tx.utility.batchAll(
          pool.tranches
            .map((_t, index: number) => {
              const nEpochs = pool.epoch.lastExecuted + 1 - orders[index].epoch
              if (!nEpochs) return null as any
              return api.tx.pools.collect(poolId, index, nEpochs)
            })
            .filter(Boolean)
        )

        return inst.wrapSignAndSendRx(api, submittable, options)
      })
    )
  }

  function approveRoles(
    args: [poolId: string, roles: PoolRoleInput[], accounts: string[]],
    options?: TransactionOptions
  ) {
    const [poolId, roles, accounts] = args
    if (roles.length !== accounts.length) throw new Error('Roles length needs to match accounts length')

    const $api = inst.getRxApi()

    return $api.pipe(
      switchMap((api) => {
        const extrinsics = roles.map((role: PoolRoleInput, index: number) =>
          api.tx.pools.approveRoleFor(poolId, role, [accounts[index]])
        )
        const submittable = api.tx.utility.batchAll(extrinsics)
        return inst.wrapSignAndSendRx(api, submittable, options)
      })
    )
  }

  function getRolesByPool(args: [address: Account]) {
    const [address] = args
    const $api = inst.getRxApi()

    const $events = $api.pipe(
      switchMap(
        (api) => combineLatest([api.query.system.events(), api.query.system.number()]),
        (api, [events]) => ({ api, events })
      ),
      filter(({ api, events }) => {
        console.log('getPools events', events)
        const event = events.find(
          ({ event }) => api.events.pools.RoleApproved.is(event) || api.events.pools.RoleRevoked.is(event)
        )

        if (!event) return false

        const [, , accountId] = (event.toJSON() as any).event.data
        return isSameAddress(address, accountId)
      })
    )

    return $api.pipe(
      switchMap((api) => api.query.permissions.permission.entries(address)),
      map((permissionsData) => {
        const roles: { [poolId: string]: PoolRoles } = {}
        permissionsData.forEach(([keys, value]) => {
          const poolId = (keys.toHuman() as string[])[1].replace(/\D/g, '')
          const permissions = value.toJSON() as any
          roles[poolId] = {
            roles: (
              ['PoolAdmin', 'Borrower', 'PricingAdmin', 'LiquidityAdmin', 'MemberListAdmin', 'RiskAdmin'] as const
            ).filter((role) => AdminRoleBits[role] & permissions.admin.bits),
            tranches: permissions.trancheInvestor.info
              .filter((info: any) => info.permissionedTill * 1000 > Date.now())
              .map((info: any) => info.trancheId),
          }
        })
        return roles
      }),
      repeatWhen(() => $events)
    )
  }

  async function getNextLoanId() {
    const $api = inst.getRxApi()

    const id = await firstValueFrom($api.pipe(switchMap((api) => api.query.loans.nextLoanId()))).toString()
    return id
  }

  function createLoan(args: [poolId: string, collectionId: string, nftId: string], options?: TransactionOptions) {
    const [poolId, collectionId, nftId] = args
    const $api = inst.getRxApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.loans.create(poolId, [collectionId, nftId])
        return inst.wrapSignAndSendRx(api, submittable, options)
      })
    )
  }

  function priceLoan<T extends keyof LoanInfoInput, I extends LoanInfoInput[T]>(
    args: [poolId: string, loanId: string, ratePerSec: string, loanType: T, loanInfo: I],
    options?: TransactionOptions
  ) {
    const [poolId, loanId, ratePerSec, loanType, loanInfo] = args
    const $api = inst.getRxApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.loans.price(poolId, loanId, ratePerSec, { [loanType]: loanInfo })
        return inst.wrapSignAndSendRx(api, submittable, options)
      })
    )
  }

  function financeLoan(args: [poolId: string, loanId: string, amount: BN], options?: TransactionOptions) {
    const [poolId, loanId, amount] = args
    const $api = inst.getRxApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.loans.borrow(poolId, loanId, amount.toString())
        return inst.wrapSignAndSendRx(api, submittable, options)
      })
    )
  }

  function repayLoanPartially(args: [poolId: string, loanId: string, amount: BN], options?: TransactionOptions) {
    const [poolId, loanId, amount] = args
    const $api = inst.getRxApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.loans.repay(poolId, loanId, amount.toString())
        return inst.wrapSignAndSendRx(api, submittable, options)
      })
    )
  }

  function repayAndCloseLoan(args: [poolId: string, loanId: string], options?: TransactionOptions) {
    const [poolId, loanId] = args
    const $api = inst.getRxApi()

    return $api.pipe(
      combineLatestWith(getLoan([poolId, loanId])),
      switchMap(([api, loan]) => {
        // Add small buffer to repayment amount
        // TODO: calculate accumulatedRate 1 minute from now and up to date outstanding debt
        const amount = new BN(loan.outstandingDebt).mul(new BN(1).mul(Currency))
        const submittable = api.tx.utility.batchAll([
          api.tx.loans.repay(poolId, loanId, amount),
          api.tx.loans.close(poolId, loanId),
        ])
        return inst.wrapSignAndSendRx(api, submittable, options)
      })
    )
  }

  function getPools() {
    const $api = inst.getRxApi()

    const $events = $api.pipe(
      switchMap(
        (api) => combineLatest([api.query.system.events(), api.query.system.number()]),
        (api, [events]) => ({ api, events })
      ),
      filter(({ api, events }) => {
        console.log('getPools events', events)
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
            latest: nav ? nav.latestNav : new BN('0'),
            lastUpdated: nav ? nav.lastUpdated : 0,
          }
          return acc
        }, {} as Record<string, { latest: BN; lastUpdated: number }>)

        const pools = rawPools.map(([key, value]) => {
          const pool = value.toJSON() as unknown as PoolDetailsData
          const metadata = (value.toHuman() as any).metadata
          const poolId = formatPoolKey(key as StorageKey<[u32]>)
          const navData = navMap[poolId]
          const mapped: Pool = {
            id: poolId,
            owner: pool.owner,
            metadata,
            currency: Object.keys(pool.currency)[0],
            tranches: pool.tranches.map((tranche: TrancheDetailsData, index: number) => {
              return {
                index,
                name: tokenIndexToName(index, pool.tranches.length),
                debt: parseBN(tranche.debt),
                reserve: parseBN(tranche.reserve),
                minRiskBuffer: parseBN(tranche.minRiskBuffer),
                ratio: parseBN(tranche.ratio),
                outstandingInvestOrders: parseBN(tranche.outstandingInvestOrders),
                outstandingRedeemOrders: parseBN(tranche.outstandingRedeemOrders),
                interestPerSec: parseBN(tranche.interestPerSec),
                lastUpdatedInterest: tranche.lastUpdatedInterest,
              }
            }),
            reserve: {
              max: parseBN(pool.maxReserve),
              available: parseBN(pool.availableReserve),
              total: parseBN(pool.totalReserve),
            },
            epoch: {
              current: pool.currentEpoch,
              lastClosed: pool.lastEpochClosed,
              lastExecuted: pool.lastEpochExecuted,
              inSubmissionPeriod: pool.submissionPeriodEpoch,
            },
            nav: {
              latest: parseBN(navData.latest),
              lastUpdated: navData.lastUpdated,
            },
            value: new BN(parseBN(pool.totalReserve)).add(new BN(parseBN(navData.latest))).toString(),
          }

          return mapped
        })

        return pools
      }),
      repeatWhen(() => $events)
    )
  }

  function getPool(args: [poolId: string]) {
    const [poolId] = args
    const $api = inst.getRxApi()

    return $api.pipe(
      switchMap((api) =>
        combineLatest([api.query.pools.pool(poolId), api.query.loans.poolNAV(poolId)]).pipe(
          switchMap(([poolValue, navValue]) => {
            const pool = poolValue.toJSON() as unknown as PoolDetailsData
            const nav = navValue.toJSON() as unknown as NAVDetailsData
            const metadata = (poolValue.toHuman() as any).metadata

            const $tokenIssuance = combineLatest(
              pool.tranches.map((_1, index: number) => api.query.ormlTokens.totalIssuance({ Tranche: [poolId, index] }))
            )

            const $epoch = combineLatest(
              pool.tranches.map((_1, index: number) => api.query.pools.epoch([poolId, index], pool.lastEpochExecuted))
            )

            return combineLatest([$tokenIssuance, $epoch]).pipe(
              map(([tokenIssuanceValues, epochValues]) => {
                const lastEpoch = epochValues.map((val) => (!val.isEmpty ? (val as any).unwrap() : null))

                const detailedPool: DetailedPool = {
                  id: poolId,
                  owner: pool.owner,
                  metadata,
                  currency: Object.keys(pool.currency)[0],
                  tranches: pool.tranches.map((tranche, index) => {
                    return {
                      index,
                      name: tokenIndexToName(index, pool.tranches.length),
                      debt: parseBN(tranche.debt),
                      reserve: parseBN(tranche.reserve),
                      totalIssuance: tokenIssuanceValues[index].toString(),
                      minRiskBuffer: parseBN(tranche.minRiskBuffer),
                      ratio: parseBN(tranche.ratio),
                      outstandingInvestOrders: parseBN(tranche.outstandingInvestOrders),
                      outstandingRedeemOrders: parseBN(tranche.outstandingRedeemOrders),
                      interestPerSec: parseBN(tranche.interestPerSec),
                      lastUpdatedInterest: tranche.lastUpdatedInterest,
                      tokenPrice: lastEpoch[index]?.tokenPrice.toString() ?? '0',
                    }
                  }),
                  nav: {
                    latest: nav ? parseBN(nav.latestNav) : '0',
                    lastUpdated: nav ? nav.lastUpdated : 0,
                  },
                  reserve: {
                    max: parseBN(pool.maxReserve),
                    available: parseBN(pool.availableReserve),
                    total: parseBN(pool.totalReserve),
                  },
                  value: new BN(parseBN(pool.totalReserve)).add(new BN(parseBN(nav.latestNav))).toString(),
                  epoch: {
                    current: pool.currentEpoch,
                    lastClosed: pool.lastEpochClosed,
                    lastExecuted: pool.lastEpochExecuted,
                    inSubmissionPeriod: pool.submissionPeriodEpoch,
                  },
                }
                return detailedPool
              })
            )
          })
        )
      )
    )
  }

  function getBalances(args: [address: Account]) {
    const [address] = args
    const $api = inst.getRxApi()

    const $blocks = $api.pipe(switchMap((api) => api.query.system.number()))

    return $api.pipe(
      switchMap((api) => api.query.ormlTokens.accounts.entries(address)),
      map((rawBalances) => {
        const balances = {
          tranches: [] as TrancheBalance[],
          tokens: [] as TokenBalance[],
        }

        rawBalances.forEach(([rawKey, rawValue]) => {
          const key = (rawKey.toHuman() as any)[1] as string | { Tranche: [string, string] }
          const value = rawValue.toJSON() as { free: string | number }
          if (typeof key !== 'string') {
            const [poolId, trancheId] = key.Tranche
            if (value.free !== 0) {
              balances.tranches.push({
                poolId: poolId.replace(/\D/g, ''),
                trancheId: parseInt(trancheId, 10),
                balance: parseHex(value.free),
              })
            }
          } else {
            balances.tokens.push({
              currency: key.toLowerCase(),
              balance: parseHex(value.free),
            })
          }
        })

        return balances
      }),
      repeatWhen(() => $blocks)
    )
  }

  function getOrder(args: [address: Account, poolId: string, trancheId: number]) {
    const [address, poolId, trancheId] = args

    const $api = inst.getRxApi()

    return $api.pipe(
      switchMap((api) => api.query.pools.order([poolId, trancheId], address)),
      map((result) => {
        const order = result.toJSON() as any

        return {
          invest: parseHex(order.invest),
          redeem: parseHex(order.redeem),
          epoch: order.epoch as number,
        }
      })
    )
  }

  function getLoans(args: [poolId: string]) {
    const [poolId] = args
    const $api = inst.getRxApi()

    const $events = $api.pipe(
      switchMap(
        (api) => combineLatest([api.query.system.events(), api.query.system.number()]),
        (api, [events]) => ({ api, events })
      ),
      filter(({ api, events }) => {
        console.log('getLoans events', events)
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
      switchMap((api) => api.query.loans.loanInfo.entries(poolId)),
      map((loanValues) => {
        return loanValues.map(([key, value]) => {
          const loan = value.toJSON() as unknown as LoanDetailsData
          const assetKey = (value.toHuman() as any).asset
          const mapped: Loan = {
            id: formatLoanKey(key as StorageKey<[u32, u32]>),
            poolId,
            financedAmount: parseBN(loan.borrowedAmount),
            financingFee: parseBN(loan.ratePerSec),
            outstandingDebt: new BN(parseBN(loan.principalDebt))
              .mul(new BN(parseBN(loan.accumulatedRate)))
              .div(new BN(10).pow(new BN(27)))
              .toString(),
            lastUpdated: loan.lastUpdated,
            originationDate: loan.originationDate,
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

  function getLoan(args: [poolId: string, loanId: string]) {
    const [poolId, loanId] = args
    const $api = inst.getRxApi()

    return $api.pipe(
      switchMap((api) => api.query.loans.loanInfo(poolId, loanId)),
      map((loanData) => {
        const loanValue = loanData.toJSON() as unknown as LoanDetailsData
        const assetKey = (loanData.toHuman() as any).asset

        const loan: Loan = {
          id: loanId,
          poolId,
          financedAmount: parseBN(loanValue.borrowedAmount),
          financingFee: parseBN(loanValue.ratePerSec),
          outstandingDebt: new BN(parseBN(loanValue.principalDebt))
            .mul(new BN(parseBN(loanValue.accumulatedRate)))
            .div(new BN(10).pow(new BN(27)))
            .toString(),
          lastUpdated: loanValue.lastUpdated,
          originationDate: loanValue.originationDate,
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
    const $api = inst.getRxApi()

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
    const $api = inst.getRxApi()

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
    const $api = inst.getRxApi()

    return $api.pipe(
      switchMap((api) => {
        const submittable = api.tx.loans.adminWriteOff(poolId, loanId, writeOffGroupId)
        return inst.wrapSignAndSendRx(api, submittable, options)
      })
    )
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
    approveRoles,
    getRolesByPool,
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
    addWriteOffGroup,
    adminWriteOff,
    getLoanCollectionIdForPool,
  }
}

const parseBN = (value: BN) => {
  return new BN(value.toString().substring(2), 'hex').toString()
}
const parseHex = (value: string | number) => {
  return new BN(value.toString().substring(2), 'hex').toString()
}

const tokenNames = [
  ['Junior'],
  ['Junior', 'Senior'],
  ['Junior', 'Mezzanine', 'Senior'],
  ['Junior', 'Mezzanine', 'Senior', 'Super-senior'],
]

const tokenIndexToName = (index: number, numberOfTranches: number) => {
  if (numberOfTranches > 0 && numberOfTranches <= 4) return tokenNames[numberOfTranches - 1][index]
  if (index <= 4) return tokenNames[3][index]
  return 'Other'
}

function getLoanInfo(loanType: LoanInfoData): LoanInfo {
  if (loanType.bulletLoan) {
    return {
      type: 'BulletLoan',
      advanceRate: parseHex(loanType.bulletLoan.advanceRate),
      probabilityOfDefault: parseHex(loanType.bulletLoan.probabilityOfDefault),
      lossGivenDefault: parseHex(loanType.bulletLoan.lossGivenDefault),
      value: parseHex(loanType.bulletLoan.value),
      discountRate: parseHex(loanType.bulletLoan.discountRate),
      maturityDate: loanType.bulletLoan.maturityDate,
    }
  }
  if (loanType.creditLine) {
    return {
      type: 'CreditLine',
      advanceRate: parseHex(loanType.creditLine.advanceRate),
      value: parseHex(loanType.creditLine.value),
    }
  }
  if (loanType.creditLineWithMaturity) {
    return {
      type: 'CreditLineWithMaturity',
      advanceRate: parseHex(loanType.creditLineWithMaturity.advanceRate),
      probabilityOfDefault: parseHex(loanType.creditLineWithMaturity.probabilityOfDefault),
      value: parseHex(loanType.creditLineWithMaturity.value),
      discountRate: parseHex(loanType.creditLineWithMaturity.discountRate),
      maturityDate: loanType.creditLineWithMaturity.maturityDate,
      lossGivenDefault: parseHex(loanType.creditLineWithMaturity.lossGivenDefault),
    }
  }

  throw new Error(`Unrecognized loan info: ${JSON.stringify(loanType)}`)
}
