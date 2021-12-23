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

export function getPoolsModule(inst: CentrifugeBase) {
  async function createPool(
    args: [poolId: string, collectionId: string, tranches: number[][], currency: string, maxReserve: BN],
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

  async function closeEpoch(args: [poolId: string], options?: TransactionOptions) {
    const [poolId] = args
    const api = await inst.getApi()
    const submittable = api.tx.utility.batchAll([api.tx.loan.updateNav(poolId), api.tx.investorPool.closeEpoch(poolId)])
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function approveRole(args: [poolId: string, role: PoolRole, accounts: string[]], options?: TransactionOptions) {
    const [poolId, role, accounts] = args
    const api = await inst.getApi()
    const submittable = api.tx.investorPool.approveRoleFor(poolId, role, accounts)
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function createLoan(args: [poolId: string, collectionId: string, nftId: string], options?: TransactionOptions) {
    const [poolId, collectionId, nftId] = args
    const api = await inst.getApi()
    const submittable = api.tx.loan.issueLoan(poolId, [collectionId, nftId])
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function priceLoan(
    args: [
      poolId: string,
      loanId: string,
      ratePerSec: string,
      loanType: 'CreditLine',
      loanInfo: CreditLineLoanInfo | BulletLoanInfo
    ],
    options?: TransactionOptions
  ) {
    const [poolId, loanId, ratePerSec, , loanInfo] = args
    const api = await inst.getApi()
    const submittable = api.tx.loan.priceLoan(poolId, loanId, ratePerSec, { CreditLine: loanInfo })
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function financeLoan(args: [poolId: string, loanId: string, amount: BN], options?: TransactionOptions) {
    const [poolId, loanId, amount] = args
    const api = await inst.getApi()
    const submittable = api.tx.loan.borrow(poolId, loanId, amount.toString())
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function getPools() {
    const api = await inst.getApi()
    return await api.query.investorPool.pool.entries()
  }

  async function getPool(args: [poolId: string]) {
    const [poolId] = args
    const api = await inst.getApi()

    const [pool, nav] = await Promise.all([api.query.investorPool.pool(poolId), api.query.loan.poolNAV(poolId)])

    return { pool: pool.toJSON(), nav: nav.toJSON() }
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
    approveRole,
    createLoan,
    priceLoan,
    financeLoan,
    getPools,
    getPool,
    addWriteOffGroup,
    adminWriteOff,
  }
}
