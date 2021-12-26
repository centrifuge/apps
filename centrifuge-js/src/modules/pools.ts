import { StorageKey, u32 } from '@polkadot/types'
import BN from 'bn.js'
import { CentrifugeBase } from '../CentrifugeBase'
import { TransactionOptions } from '../types'

export type Pool = {
  id: string
}

const LoanPalletAccountId = '0x6d6f646c70616c2f6c6f616e0000000000000000000000000000000000000000'

export type PoolRole = 'PoolAdmin' | 'Borrower' | 'PricingAdmin' | 'LiquidityAdmin' | 'MemberListAdmin' | 'RiskAdmin'

export type LoanType = 'BulletLoan' | 'CreditLine' | 'CreditLineWithMaturity'

export type CreditLineLoanInfo = [string, string]
export type BulletLoanInfo = [string, string, string, string, string, string]

type TrancheDetails = {
  debt: BN
  reserve: BN
  minSubordinationRatio: BN
  epochSupply: BN
  epochRedeem: BN
  ratio: BN
  interestPerSec: BN
  lastUpdatedInterest: number
}

type PoolDetails = {
  owner: string
  currency: { [key: string]: null }
  tranches: TrancheDetails[]
  currentEpoch: number
  lastEpochClosed: number
  lastEpochExecuted: number
  closingEpoch: number | null
  maxReserve: BN
  availableReserve: BN
  totalReserve: BN
  metadata: string
}

type NAVDetails = {
  latestNav: BN
  lastUpdated: number
}

const formatPoolKey = (keys: StorageKey<[u32]>) => (keys.toHuman() as string[])[0].replace(/\D/g, '')

export function getPoolsModule(inst: CentrifugeBase) {
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
    const [poolId, collectionId, tranches, currency, maxReserve, metadata] = args
    const api = await inst.getApi()
    const submittable = api.tx.utility.batchAll([
      api.tx.uniques.create(collectionId, LoanPalletAccountId),
      api.tx.investorPool.createPool(poolId, tranches, currency, maxReserve.toString(), metadata),
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

  async function closeEpoch(args: [poolId: string], options?: TransactionOptions) {
    const [poolId] = args
    const api = await inst.getApi()
    const submittable = api.tx.utility.batchAll([api.tx.loan.updateNav(poolId), api.tx.investorPool.closeEpoch(poolId)])
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

  // TODO: loanInfo type should be dependent on loanType
  async function priceLoan(
    args: [
      poolId: string,
      loanId: string,
      ratePerSec: string,
      loanType: 'CreditLine' | 'BulletLoan',
      loanInfo: CreditLineLoanInfo | BulletLoanInfo
    ],
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

  // async function repayLoanFully(args: [poolId: string, loanId: string], options?: TransactionOptions) {
  //   const [poolId, loanId] = args
  //   const api = await inst.getApi()
  //   const submittable = api.tx.loan.repay(poolId, loanId, amount.toString())
  //   return inst.wrapSignAndSend(api, submittable, options)
  // }

  async function getPools() {
    const api = await inst.getApi()
    const rawPools = await api.query.investorPool.pool.entries()

    const pools = rawPools.map(([key, value]) => {
      const pool = value.toJSON() as unknown as PoolDetails
      return {
        name: formatPoolKey(key as StorageKey<[u32]>),
        owner: pool.owner,
        currentEpoch: pool.currentEpoch,
        lastEpochClosed: pool.lastEpochClosed,
        lastEpochExecuted: pool.lastEpochExecuted,
        closingEpoch: pool.closingEpoch,
        currency: Object.keys(pool.currency)[0],
        maxReserve: parseBN(pool.maxReserve),
        availableReserve: parseBN(pool.availableReserve),
        totalReserve: parseBN(pool.totalReserve),
        tranches: pool.tranches.map((tranche: TrancheDetails, index: number) => {
          return {
            name: tokenIndexToName(index, pool.tranches.length),
            debt: parseBN(tranche.debt),
            reserve: parseBN(tranche.reserve),
            minSubordinationRatio: parseBN(tranche.minSubordinationRatio),
            epochSupply: parseBN(tranche.epochSupply),
            epochRedeem: parseBN(tranche.epochRedeem),
            ratio: parseBN(tranche.ratio),
            interestPerSec: parseBN(tranche.interestPerSec),
            lastUpdatedInterest: tranche.lastUpdatedInterest,
          }
        }),
      }
    })

    return pools
  }

  async function getPool(args: [poolId: string]) {
    const [poolId] = args
    const api = await inst.getApi()

    const [poolValue, navValue] = await Promise.all([
      api.query.investorPool.pool(poolId),
      api.query.loan.poolNAV(poolId),
    ])

    const pool = poolValue.toJSON() as unknown as PoolDetails
    const nav = navValue.toJSON() as unknown as NAVDetails

    const tokenIssuanceValues = await Promise.all(
      pool.tranches.map((_1, index: number) => api.query.tokens.totalIssuance({ Tranche: [poolId, index] }))
    )

    const totalIssuance = tokenIssuanceValues.map((val) => parseBN(val as unknown as BN))

    return {
      pool: {
        totalIssuance,
        name: poolId,
        owner: pool.owner,
        metadata: Buffer.from(pool.metadata.substring(2), 'hex').toString(),
        currency: Object.keys(pool.currency)[0],
        tranches: pool.tranches.map((tranche: TrancheDetails, index: number) => {
          return {
            name: tokenIndexToName(index, pool.tranches.length),
            debt: parseBN(tranche.debt),
            reserve: parseBN(tranche.reserve),
            supply: totalIssuance[index],
            minSubordinationRatio: parseBN(tranche.minSubordinationRatio),
            epochSupply: parseBN(tranche.epochSupply),
            epochRedeem: parseBN(tranche.epochRedeem),
            ratio: parseBN(tranche.ratio),
            interestPerSec: parseBN(tranche.interestPerSec),
            lastUpdatedInterest: tranche.lastUpdatedInterest,
          }
        }),
        nav: {
          latest: nav ? parseBN(nav.latestNav) : new BN(0),
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
      },
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
    closeEpoch,
    approveRoles,
    getNextLoanId,
    createLoan,
    priceLoan,
    financeLoan,
    repayLoanPartially,
    getPools,
    getPool,
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
