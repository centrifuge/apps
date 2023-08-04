export type SubqueryPoolSnapshot = {
  __typename?: 'PoolSnapshot'
  id: string
  timestamp: string
  portfolioValuation: number
  totalReserve: number
  availableReserve: number
  maxReserve: number
  totalDebt?: number | null
  totalBorrowed?: number | null
  totalRepaid?: number | null
  totalInvested?: number | null
  totalRedeemed?: number | null
  sumBorrowedAmount?: number | null
  sumBorrowedAmountByPeriod?: number | null
  sumRepaidAmountByPeriod?: number | null
  sumInvestedAmountByPeriod?: number | null
  sumRedeemedAmountByPeriod?: number | null
  blockNumber: number
}

export type SubqueryTrancheSnapshot = {
  __typename?: 'TrancheSnapshot'
  id: string
  tokenPrice: string
  blockNumber: number
  timestamp: string
  trancheId: string // poolId-trancheId
  tranche: {
    poolId: string
    trancheId: string
  }
  tokenSupply?: number | null

  sumOutstandingInvestOrdersByPeriod: number
  sumOutstandingRedeemOrdersByPeriod: number
  sumFulfilledInvestOrdersByPeriod: number
  sumFulfilledRedeemOrdersByPeriod: number
}

export type InvestorTransactionType =
  | 'INVEST_ORDER_UPDATE'
  | 'REDEEM_ORDER_UPDATE'
  | 'INVEST_ORDER_CANCEL'
  | 'REDEEM_ORDER_CANCEL'
  | 'INVEST_EXECUTION'
  | 'REDEEM_EXECUTION'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'INVEST_COLLECT'
  | 'REDEEM_COLLECT'

export type SubqueryInvestorTransaction = {
  __typename?: 'InvestorTransaction'
  id: string
  timestamp: string
  accountId: string
  trancheId: string
  epochNumber: number
  type: InvestorTransactionType
  currencyAmount?: number | null
  tokenAmount?: number | null
  tokenPrice?: number | null
  transactionFee?: number | null
}

export type BorrowerTransactionType = 'CREATED' | 'PRICED' | 'BORROWED' | 'REPAID' | 'CLOSED'

export type SubqueryBorrowerTransaction = {
  __typename?: 'BorrowerTransaction'
  id: string
  timestamp: string
  poolId: string
  accountId: string
  epochId: string
  loanId: string
  type: BorrowerTransactionType
  amount?: number | null
}

export type SubqueryEpoch = {
  id: string
  poolId: string
  index: number
  openedAt: string
  closedAt: string
  executedAt: string
  sumBorrowedAmount: number | null
  sumRepaidAmount: number | null
  sumInvestedAmount: number | null
  sumRedeemedAmount: number | null
}
