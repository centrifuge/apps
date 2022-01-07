import { StorageKey, u32 } from '@polkadot/types'
import BN from 'bn.js'
import { CentrifugeBase } from '../CentrifugeBase'
import { TransactionOptions } from '../types'

const Currency = new BN(10).pow(new BN(18))

const LoanPalletAccountId = '0x6d6f646c70616c2f6c6f616e0000000000000000000000000000000000000000'

export type PoolRole = 'PoolAdmin' | 'Borrower' | 'PricingAdmin' | 'LiquidityAdmin' | 'MemberListAdmin' | 'RiskAdmin'

export type LoanInfo = {
  BulletLoan: [string, string, string, string, string, string]
  CreditLine: [string, string]
  CreditLineWithMaturity: [string, string, string, string, string, string]
}

type TrancheDetailsData = {
  debt: BN
  reserve: BN
  minSubordinationRatio: BN
  epochSupply: BN
  epochRedeem: BN
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
  closingEpoch: number | null
  maxReserve: BN
  availableReserve: BN
  totalReserve: BN
  metadata: string
}

type NAVDetailsData = {
  latestNav: BN
  lastUpdated: number
}

export type Pool = {
  id: string
  owner: string
  currency: string
  metadata: string
  tranches: {
    index: number
    name: string
    debt: string
    reserve: string
    minSubordinationRatio: string
    outstandingInvestOrders: string
    outstandingRedeemOrders: string
    interestPerSec: string
    lastUpdatedInterest: number
  }[]
  reserve: {
    max: string
    available: string
    total: string
  }
  epoch: {
    current: number
    lastClosed: number
    lastExecuted: number
    closing: number | null
  }
}

export type DetailedPool = Omit<Pool, 'tranches'> & {
  nav: {
    latest: string
    lastUpdated: number
  }
  tranches: {
    index: number
    name: string
    debt: string
    reserve: string
    minSubordinationRatio: string
    outstandingInvestOrders: string
    outstandingRedeemOrders: string
    interestPerSec: string
    lastUpdatedInterest: number
    totalIssuance: string
    tokenPrice: string
  }[]
}

export enum LoanStatus {
  // this when asset is locked and loan nft is issued.
  Issued = 'Issued',
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
  loanType: { [key: string]: LoanInfo }
  adminWrittenOff: boolean
  writeOffIndex: number | null
}

export type Loan = {
  id: string
  financedAmount: string
  financingFee: string
  outstandingDebt: string
  lastUpdated: number
  originationDate: number
  status: LoanStatus
  loanType: {
    [key: string]: LoanInfo
  }
  adminWrittenOff: boolean
  writeOffIndex: number | null
}

const formatPoolKey = (keys: StorageKey<[u32]>) => (keys.toHuman() as string[])[0].replace(/\D/g, '')
const formatLoanKey = (keys: StorageKey<[u32, u32]>) => (keys.toHuman() as string[])[1].replace(/\D/g, '')

export function getPoolsModule(inst: CentrifugeBase) {
  // TODO: integrate ipfs pinning
  async function createPool(
    args: [
      poolId: string,
      collectionId: string,
      tranches: number[][],
      currency: string,
      maxReserve: BN,
      metadata: string
    ],
    options?: TransactionOptions
  ) {
    const [poolId, collectionId, tranches, currency, maxReserve] = args
    const api = await inst.getApi()
    const submittable = api.tx.utility.batchAll([
      api.tx.uniques.create(collectionId, LoanPalletAccountId),
      api.tx.investorPool.createPool(poolId, tranches, currency, maxReserve.toString()),
      api.tx.loan.initialisePool(poolId, collectionId),
    ])
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function updateInvestOrder(
    args: [poolId: string, trancheId: number, newOrder: BN],
    options?: TransactionOptions
  ) {
    const [poolId, trancheId, newOrder] = args
    const api = await inst.getApi()
    const submittable = api.tx.investorPool.orderSupply(poolId, trancheId, newOrder.toString())
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function updateRedeemOrder(
    args: [poolId: string, trancheId: number, newOrder: BN],
    options?: TransactionOptions
  ) {
    const [poolId, trancheId, newOrder] = args
    const api = await inst.getApi()
    const submittable = api.tx.investorPool.orderRedeem(poolId, trancheId, newOrder.toString())
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function closeEpoch(args: [poolId: string], options?: TransactionOptions) {
    const [poolId] = args
    const api = await inst.getApi()
    const submittable = api.tx.utility.batchAll([api.tx.loan.updateNav(poolId), api.tx.investorPool.closeEpoch(poolId)])
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function submitSolution(args: [poolId: string, solution: string[][]], options?: TransactionOptions) {
    const [poolId, solution] = args
    const api = await inst.getApi()
    const submittable = api.tx.investorPool.solveEpoch(poolId, solution)
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function collect(args: [poolId: string, trancheId?: number], options?: TransactionOptions) {
    const [poolId, trancheId] = args
    const api = await inst.getApi()
    const pool = await getPool([poolId])
    const submittable =
      trancheId !== undefined
        ? api.tx.investorPool.collect(poolId, trancheId, pool.epoch.lastExecuted)
        : api.tx.utility.batchAll(
            pool.tranches.map((_t, index: number) =>
              api.tx.investorPool.collect(poolId, index, pool.epoch.lastExecuted)
            )
          )
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function approveRoles(
    args: [poolId: string, roles: PoolRole[], accounts: string[]],
    options?: TransactionOptions
  ) {
    const [poolId, roles, accounts] = args
    if (roles.length !== accounts.length) throw new Error('Roles length needs to match accounts length')

    const api = await inst.getApi()
    const extrinsics = roles.map((role: PoolRole, index: number) =>
      api.tx.investorPool.approveRoleFor(poolId, role, [accounts[index]])
    )
    const submittable = api.tx.utility.batchAll(extrinsics)
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function getNextLoanId() {
    const api = await inst.getApi()
    return (await api.query.loan.nextLoanId()).toString()
  }

  async function createLoan(args: [poolId: string, collectionId: string, nftId: string], options?: TransactionOptions) {
    const [poolId, collectionId, nftId] = args
    const api = await inst.getApi()
    const submittable = api.tx.loan.issueLoan(poolId, [collectionId, nftId])
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function priceLoan<T extends keyof LoanInfo, I extends LoanInfo[T]>(
    args: [poolId: string, loanId: string, ratePerSec: string, loanType: T, loanInfo: I],
    options?: TransactionOptions
  ) {
    const [poolId, loanId, ratePerSec, loanType, loanInfo] = args
    const api = await inst.getApi()
    const submittable = api.tx.loan.priceLoan(poolId, loanId, ratePerSec, { [loanType]: loanInfo })
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function financeLoan(args: [poolId: string, loanId: string, amount: BN], options?: TransactionOptions) {
    const [poolId, loanId, amount] = args
    const api = await inst.getApi()
    const submittable = api.tx.loan.borrow(poolId, loanId, amount.toString())
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function repayLoanPartially(args: [poolId: string, loanId: string, amount: BN], options?: TransactionOptions) {
    const [poolId, loanId, amount] = args
    const api = await inst.getApi()
    const submittable = api.tx.loan.repay(poolId, loanId, amount.toString())
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function repayAndCloseLoan(args: [poolId: string, loanId: string], options?: TransactionOptions) {
    const [poolId, loanId] = args
    const api = await inst.getApi()
    const loan = await getLoan([poolId, loanId])

    // Add small buffer to repayment amount
    // TODO: calculate accumulatedRate 1 minute from now and up to date outstanding debt
    const amount = new BN(loan.outstandingDebt).mul(new BN(1).mul(Currency))
    const submittable = api.tx.utility.batchAll([
      api.tx.loan.repay(poolId, loanId, amount),
      api.tx.loan.closeLoan(poolId, loanId),
    ])
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function getPools(): Promise<Pool[]> {
    const api = await inst.getApi()
    const rawPools = await api.query.investorPool.pool.entries()

    const pools = rawPools.map(([key, value]) => {
      const pool = value.toJSON() as unknown as PoolDetailsData
      const metadata = (value.toHuman() as any).metadata
      return {
        id: formatPoolKey(key as StorageKey<[u32]>),
        owner: pool.owner,
        metadata,
        currency: Object.keys(pool.currency)[0],
        tranches: pool.tranches.map((tranche: TrancheDetailsData, index: number) => {
          return {
            index,
            name: tokenIndexToName(index, pool.tranches.length),
            debt: parseBN(tranche.debt),
            reserve: parseBN(tranche.reserve),
            minSubordinationRatio: parseBN(tranche.minSubordinationRatio),
            outstandingInvestOrders: parseBN(tranche.epochSupply),
            outstandingRedeemOrders: parseBN(tranche.epochRedeem),
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
          closing: pool.closingEpoch,
        },
      }
    })

    return pools
  }

  async function getPool(args: [poolId: string]): Promise<DetailedPool> {
    const [poolId] = args
    const api = await inst.getApi()

    const [poolValue, navValue] = await Promise.all([
      api.query.investorPool.pool(poolId),
      api.query.loan.poolNAV(poolId),
    ])

    const pool = poolValue.toJSON() as unknown as PoolDetailsData
    const nav = navValue.toJSON() as unknown as NAVDetailsData
    const metadata = (poolValue.toHuman() as any).metadata

    const tokenIssuanceValues = await Promise.all(
      pool.tranches.map((_1, index: number) => api.query.tokens.totalIssuance({ Tranche: [poolId, index] }))
    )

    const orderValues = await Promise.all(
      pool.tranches.map((_1, index: number) => api.query.investorPool.order.entries({ Tranche: [poolId, index] }))
    )

    console.log(JSON.stringify(orderValues, null, 4))

    const epochValues = await Promise.all(
      pool.tranches.map((_1, index: number) => api.query.investorPool.epoch([poolId, index], pool.lastEpochExecuted))
    )
    const lastEpoch = epochValues.map((val) => (val as any).unwrap())

    return {
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
          minSubordinationRatio: parseBN(tranche.minSubordinationRatio),
          outstandingInvestOrders: parseBN(tranche.epochSupply),
          outstandingRedeemOrders: parseBN(tranche.epochRedeem),
          interestPerSec: parseBN(tranche.interestPerSec),
          lastUpdatedInterest: tranche.lastUpdatedInterest,
          tokenPrice: lastEpoch[index]?.tokenPrice.toString(),
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
      epoch: {
        current: pool.currentEpoch,
        lastClosed: pool.lastEpochClosed,
        lastExecuted: pool.lastEpochExecuted,
        closing: pool.closingEpoch,
      },
    }
  }

  async function getLoans(args: [poolId: string]): Promise<Loan[]> {
    const [poolId] = args
    const api = await inst.getApi()

    const loanValues = await api.query.loan.loanInfo.entries(poolId)

    return loanValues.map(([key, value]) => {
      const loan = value.toJSON() as unknown as LoanDetailsData
      return {
        id: formatLoanKey(key as StorageKey<[u32, u32]>),
        financedAmount: parseBN(loan.borrowedAmount),
        financingFee: parseBN(loan.ratePerSec),
        outstandingDebt: new BN(parseBN(loan.principalDebt))
          .mul(new BN(parseBN(loan.accumulatedRate)))
          .div(new BN(10).pow(new BN(27)))
          .toString(),
        lastUpdated: loan.lastUpdated,
        originationDate: loan.originationDate,
        status: loan.status,
        loanType: loan.loanType,
        adminWrittenOff: loan.adminWrittenOff,
        writeOffIndex: loan.writeOffIndex,
      }
    })
  }

  async function getLoan(args: [poolId: string, loanId: string]): Promise<Loan> {
    const [poolId, loanId] = args
    const api = await inst.getApi()

    const loanValue = await api.query.loan.loanInfo(poolId, loanId)

    const loan = loanValue.toJSON() as unknown as LoanDetailsData

    return {
      id: loanId,
      financedAmount: parseBN(loan.borrowedAmount),
      financingFee: parseBN(loan.ratePerSec),
      outstandingDebt: new BN(parseBN(loan.principalDebt))
        .mul(new BN(parseBN(loan.accumulatedRate)))
        .div(new BN(10).pow(new BN(27)))
        .toString(),
      lastUpdated: loan.lastUpdated,
      originationDate: loan.originationDate,
      status: loan.status,
      loanType: loan.loanType,
      adminWrittenOff: loan.adminWrittenOff,
      writeOffIndex: loan.writeOffIndex,
    }
  }

  async function addWriteOffGroup(
    args: [poolId: string, percentage: BN, overdueDays: number],
    options?: TransactionOptions
  ) {
    const [poolId, percentage, overdueDays] = args
    const api = await inst.getApi()
    const submittable = api.tx.loan.addWriteOffGroupToPool(poolId, [percentage.toString(), overdueDays])
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function adminWriteOff(
    args: [poolId: string, loanId: string, writeOffGroupId: number],
    options?: TransactionOptions
  ) {
    const [poolId, loanId, writeOffGroupId] = args
    const api = await inst.getApi()
    const submittable = api.tx.loan.adminWriteOffLoan(poolId, loanId, writeOffGroupId)
    return inst.wrapSignAndSend(api, submittable, options)
  }

  return {
    createPool,
    updateInvestOrder,
    updateRedeemOrder,
    collect,
    closeEpoch,
    submitSolution,
    approveRoles,
    getNextLoanId,
    createLoan,
    priceLoan,
    financeLoan,
    repayLoanPartially,
    repayAndCloseLoan,
    getPools,
    getPool,
    getLoans,
    getLoan,
    addWriteOffGroup,
    adminWriteOff,
  }
}

const parseBN = (value: BN) => {
  return new BN(value.toString().substring(2), 'hex').toString()
}

const tokenNames = [
  ['Junior'],
  ['Senior', 'Junior'],
  ['Senior', 'Mezzanine', 'Junior'],
  ['Super-senior', 'Senior', 'Mezzanine', 'Junior'],
]

const tokenIndexToName = (index: number, numberOfTranches: number) => {
  if (numberOfTranches > 0 && numberOfTranches <= 4) return tokenNames[numberOfTranches - 1][index]
  if (index <= 4) return tokenNames[3][index]
  return 'Other'
}
