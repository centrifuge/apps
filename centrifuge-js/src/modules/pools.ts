import { CentrifugeBase } from '../CentrifugeBase'
import { TransactionOptions } from '../types'

export type Pool = {
  id: string
}

const LoanPalletAccountId = '0x6d6f646c70616c2f6c6f616e0000000000000000000000000000000000000000'

export type PoolRole = 'PoolAdmin' | 'Borrower' | 'PricingAdmin' | 'LiquidityAdmin' | 'MemberListAdmin' | 'RiskAdmin'

export function getPoolsModule(inst: CentrifugeBase) {
  async function getPools() {
    const api = await inst.getApi()
    const pools = await api.query.investorPool.pool.entries()
    return pools
  }

  async function createPool(
    args: [poolId: string, collectionId: string, tranches: number[][], currency: string, maxReserve: number],
    options?: TransactionOptions
  ) {
    const [poolId, collectionId, tranches, currency, maxReserve] = args
    const api = await inst.getApi()
    const submittable = api.tx.utility.batchAll([
      api.tx.uniques.create(collectionId, LoanPalletAccountId),
      api.tx.investorPool.createPool(poolId, tranches, currency, maxReserve),
      api.tx.loan.initialisePool(poolId, collectionId),
    ])
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function updateInvestOrder(
    args: [poolId: string, trancheId: number, newOrder: number],
    options?: TransactionOptions
  ) {
    const [poolId, trancheId, newOrder] = args
    const api = await inst.getApi()
    const submittable = api.tx.investorPool.orderSupply(poolId, trancheId, newOrder)
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
    const submittable = api.tx.loan.issueLoan(poolId, { classId: collectionId, instanceId: nftId })
    return inst.wrapSignAndSend(api, submittable, options)
  }

  return {
    getPools,
    createPool,
    updateInvestOrder,
    closeEpoch,
    approveRole,
    createLoan,
  }
}
