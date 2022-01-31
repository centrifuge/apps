import { StorageKey, u32 } from '@polkadot/types'
import BN from 'bn.js'
import { CentrifugeBase } from '../CentrifugeBase'
import { TransactionOptions } from '../types'

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
    minRiskBuffer: string
    ratio: string
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
    inSubmissionPeriod: number | null
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
    minRiskBuffer: string
    ratio: string
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

export type Investment = {
  poolId: string
  trancheIndex: number
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
  // TODO: integrate ipfs pinning
  async function createPool(
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
    const api = await inst.getApi()
    const submittable = api.tx.utility.batchAll([
      api.tx.uniques.create(collectionId, LoanPalletAccountId),
      api.tx.pools.create(poolId, tranches, currency, maxReserve.toString()),
      api.tx.pools.setMetadata(poolId, metadata),
      api.tx.loans.initialisePool(poolId, collectionId),
    ])
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function updatePool(
    args: [poolId: string, minEpochTime: BN, challengeTime: BN, maxNavAge: BN],
    options?: TransactionOptions
  ) {
    const [poolId, minEpochTime, challengeTime, maxNavAge] = args
    const api = await inst.getApi()
    const submittable = api.tx.pools.update(
      poolId,
      minEpochTime.toString(),
      challengeTime.toString(),
      maxNavAge.toString()
    )
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function setMaxReserve(args: [poolId: string, maxReserve: BN], options?: TransactionOptions) {
    const [poolId, maxReserve] = args
    const api = await inst.getApi()
    const submittable = api.tx.pools.setMaxReserve(poolId, maxReserve.toString())
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function updateInvestOrder(
    args: [poolId: string, trancheId: number, newOrder: BN],
    options?: TransactionOptions
  ) {
    const [poolId, trancheId, newOrder] = args
    const api = await inst.getApi()
    const submittable = api.tx.pools.updateInvestOrder(poolId, trancheId, newOrder.toString())
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function updateRedeemOrder(
    args: [poolId: string, trancheId: number, newOrder: BN],
    options?: TransactionOptions
  ) {
    const [poolId, trancheId, newOrder] = args
    const api = await inst.getApi()
    const submittable = api.tx.pools.updateRedeemOrder(poolId, trancheId, newOrder.toString())
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function closeEpoch(args: [poolId: string], options?: TransactionOptions) {
    const [poolId] = args
    const api = await inst.getApi()
    const submittable = api.tx.utility.batchAll([api.tx.loans.updateNav(poolId), api.tx.pools.closeEpoch(poolId)])
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function submitSolution(args: [poolId: string, solution: string[][]], options?: TransactionOptions) {
    const [poolId, solution] = args
    const api = await inst.getApi()
    const submittable = api.tx.pools.submitSolution(poolId, solution)
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function collect(args: [poolId: string, trancheId?: number], options?: TransactionOptions) {
    const [poolId, trancheId] = args
    const api = await inst.getApi()
    const pool = await getPool([poolId])
    const submittable =
      trancheId !== undefined
        ? api.tx.pools.collect(poolId, trancheId, pool.epoch.lastExecuted)
        : api.tx.utility.batchAll(
            pool.tranches.map((_t, index: number) => api.tx.pools.collect(poolId, index, pool.epoch.lastExecuted))
          )
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function approveRoles(
    args: [poolId: string, roles: PoolRoleInput[], accounts: string[]],
    options?: TransactionOptions
  ) {
    const [poolId, roles, accounts] = args
    if (roles.length !== accounts.length) throw new Error('Roles length needs to match accounts length')

    const api = await inst.getApi()
    const extrinsics = roles.map((role: PoolRoleInput, index: number) =>
      api.tx.pools.approveRoleFor(poolId, role, [accounts[index]])
    )
    const submittable = api.tx.utility.batchAll(extrinsics)
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function getRolesByPool(args: [address: string]): Promise<{ [poolId: string]: PoolRoles }> {
    const api = await inst.getApi()
    const permissionsRaw = await api.query.permissions.permission.entries(args[0])

    const roles: { [poolId: string]: PoolRoles } = {}
    permissionsRaw.forEach(([keys, value]) => {
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
  }

  async function getNextLoanId() {
    const api = await inst.getApi()
    return (await api.query.loans.nextLoanId()).toString()
  }

  async function createLoan(args: [poolId: string, collectionId: string, nftId: string], options?: TransactionOptions) {
    const [poolId, collectionId, nftId] = args
    const api = await inst.getApi()
    const submittable = api.tx.loans.create(poolId, [collectionId, nftId])
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function priceLoan<T extends keyof LoanInfoInput, I extends LoanInfoInput[T]>(
    args: [poolId: string, loanId: string, ratePerSec: string, loanType: T, loanInfo: I],
    options?: TransactionOptions
  ) {
    const [poolId, loanId, ratePerSec, loanType, loanInfo] = args
    const api = await inst.getApi()
    const submittable = api.tx.loans.price(poolId, loanId, ratePerSec, { [loanType]: loanInfo })
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function financeLoan(args: [poolId: string, loanId: string, amount: BN], options?: TransactionOptions) {
    const [poolId, loanId, amount] = args
    const api = await inst.getApi()
    const submittable = api.tx.loans.borrow(poolId, loanId, amount.toString())
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function repayLoanPartially(args: [poolId: string, loanId: string, amount: BN], options?: TransactionOptions) {
    const [poolId, loanId, amount] = args
    const api = await inst.getApi()
    const submittable = api.tx.loans.repay(poolId, loanId, amount.toString())
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
      api.tx.loans.repay(poolId, loanId, amount),
      api.tx.loans.close(poolId, loanId),
    ])
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function getPools(): Promise<Pool[]> {
    const api = await inst.getApi()
    const rawPools = await api.query.pools.pool.entries()

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
      }
    })

    return pools
  }

  async function getPool(args: [poolId: string]): Promise<DetailedPool> {
    const [poolId] = args
    const api = await inst.getApi()

    const [poolValue, navValue] = await Promise.all([
      api.query.pools.pool(poolId),
      api.query.loans.poolNAV(poolId),
      // api.query.loans.poolToLoanNftClass(poolId),
    ])

    const pool = poolValue.toJSON() as unknown as PoolDetailsData
    const nav = navValue.toJSON() as unknown as NAVDetailsData
    const metadata = (poolValue.toHuman() as any).metadata

    const tokenIssuanceValues = await Promise.all(
      pool.tranches.map((_1, index: number) => api.query.ormlTokens.totalIssuance({ Tranche: [poolId, index] }))
    )

    const orderValues = await Promise.all(
      pool.tranches.map((_1, index: number) => api.query.pools.order.entries({ Tranche: [poolId, index] }))
    )

    console.log(JSON.stringify(orderValues, null, 4))

    const epochValues = await Promise.all(
      pool.tranches.map((_1, index: number) => api.query.pools.epoch([poolId, index], pool.lastEpochExecuted))
    )
    const lastEpoch = epochValues.filter((val) => !val.isEmpty).map((val) => (val as any).unwrap())

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
          minRiskBuffer: parseBN(tranche.minRiskBuffer),
          ratio: parseBN(tranche.ratio),
          outstandingInvestOrders: parseBN(tranche.outstandingInvestOrders),
          outstandingRedeemOrders: parseBN(tranche.outstandingRedeemOrders),
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
        inSubmissionPeriod: pool.submissionPeriodEpoch,
      },
    }
  }

  async function getInvestments(args: [address: string]): Promise<Investment[]> {
    const api = await inst.getApi()
    const rawTokens = await api.query.ormlTokens.accounts.entries(args[0])

    const tokens = rawTokens
      .map(([key, value]) => [key.toHuman(), value.toJSON()] as any)
      .filter(([key, value]) => typeof key[1] !== 'string' && value.free !== 0)
      .map(([key, value]) => {
        const [poolId, trancheIndex] = key[1].Tranche
        return {
          poolId: poolId.replace(/\D/g, ''),
          trancheIndex: parseInt(trancheIndex, 10),
          balance: parseHex(value.free),
        }
      })

    return tokens
  }

  async function getLoans(args: [poolId: string]): Promise<Loan[]> {
    const [poolId] = args
    const api = await inst.getApi()

    const loanValues = await api.query.loans.loanInfo.entries(poolId)

    return loanValues.map(([key, value]) => {
      const loan = value.toJSON() as unknown as LoanDetailsData
      const assetKey = (value.toHuman() as any).asset
      return {
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
    })
  }

  async function getLoan(args: [poolId: string, loanId: string]): Promise<Loan> {
    const [poolId, loanId] = args
    const api = await inst.getApi()

    const loanValue = await api.query.loans.loanInfo(poolId, loanId)

    const loan = loanValue.toJSON() as unknown as LoanDetailsData
    const assetKey = (loanValue.toHuman() as any).asset

    return {
      id: loanId,
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
  }

  async function getLoanCollectionIdForPool(args: [poolId: string]) {
    const [poolId] = args
    const api = await inst.getApi()

    const result = await api.query.loans.poolToLoanNftClass(poolId)
    const collectionId = (result.toHuman() as string).replace(/\D/g, '')

    return collectionId
  }

  async function addWriteOffGroup(
    args: [poolId: string, percentage: BN, overdueDays: number],
    options?: TransactionOptions
  ) {
    const [poolId, percentage, overdueDays] = args
    const api = await inst.getApi()
    const submittable = api.tx.loans.addWriteOffGroup(poolId, [percentage.toString(), overdueDays])
    return inst.wrapSignAndSend(api, submittable, options)
  }

  async function adminWriteOff(
    args: [poolId: string, loanId: string, writeOffGroupId: number],
    options?: TransactionOptions
  ) {
    const [poolId, loanId, writeOffGroupId] = args
    const api = await inst.getApi()
    const submittable = api.tx.loans.adminWriteOff(poolId, loanId, writeOffGroupId)
    return inst.wrapSignAndSend(api, submittable, options)
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
    getInvestments,
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
  ['Senior', 'Junior'],
  ['Senior', 'Mezzanine', 'Junior'],
  ['Super-senior', 'Senior', 'Mezzanine', 'Junior'],
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
