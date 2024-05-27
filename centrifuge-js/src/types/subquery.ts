import { CurrencyBalance, Price } from '../utils/BN'

export type SubqueryPoolSnapshot = {
  __typename?: 'PoolSnapshot'
  id: string
  timestamp: string
  value: string
  portfolioValuation: string
  totalReserve: string
  availableReserve: string
  maxReserve: string
  totalDebt?: string | null
  totalBorrowed?: string | null
  totalRepaid?: string | null
  totalInvested?: string | null
  totalRedeemed?: string | null
  sumBorrowedAmount?: string | null
  sumBorrowedAmountByPeriod?: string | null
  sumInterestRepaidAmountByPeriod?: string | null
  sumRepaidAmountByPeriod?: string | null
  sumInvestedAmountByPeriod?: string | null
  sumRedeemedAmountByPeriod?: string | null
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
  tokenSupply: string
  sumOutstandingInvestOrdersByPeriod: string
  sumOutstandingRedeemOrdersByPeriod: string
  sumFulfilledInvestOrdersByPeriod: string
  sumFulfilledRedeemOrdersByPeriod: string
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
  | 'INVEST_LP_COLLECT'
  | 'REDEEM_LP_COLLECT'

export type SubqueryInvestorTransaction = {
  __typename?: 'InvestorTransaction'
  id: string
  timestamp: string
  accountId: string
  account: {
    chainId: string
    evmAddress?: string
  }
  poolId: string
  trancheId: string
  epochNumber: number
  type: InvestorTransactionType
  hash: string
  currencyAmount?: CurrencyBalance | null
  tokenAmount?: CurrencyBalance | null
  tokenPrice?: Price | null
  transactionFee?: string | null
}

export type AssetTransactionType = 'CREATED' | 'PRICED' | 'BORROWED' | 'REPAID' | 'CLOSED'

export enum AssetType {
  OnchainCash = 'OnchainCash',
  OffchainCash = 'OffchainCash',
  Other = 'Other',
}

export type SubqueryAssetTransaction = {
  __typename?: 'AssetTransaction'
  id: string
  timestamp: string
  poolId: string
  accountId: string
  hash: string
  epochId: string
  type: AssetTransactionType
  amount: CurrencyBalance | undefined
  principalAmount: CurrencyBalance | undefined
  interestAmount: CurrencyBalance | undefined
  settlementPrice: string | null
  quantity: string | null
  asset: {
    id: string
    metadata: string
    type: AssetType
  }
}

export type PoolFeeTransactionType = 'PROPOSED' | 'ADDED' | 'REMOVED' | 'CHARGED' | 'UNCHARGED' | 'PAID' | 'ACCRUED'

export type SubqueryPoolFeeTransaction = {
  __typename?: 'PoolFeeTransaction'
  id: string
  type: PoolFeeTransactionType
  timestamp: string
  blockNumber: string
  epochNumber: string
  amount: CurrencyBalance | undefined
  poolFee: {
    feeId: Number
  }
}

export type SubqueryTrancheBalances = {
  __typename?: 'TrancheBalances'
  id: string
  accountId: string
  account: {
    chainId: string
    evmAddress?: string
  }
  poolId: string
  trancheId: string
  pendingInvestCurrency: string
  claimableTrancheTokens: string
  sumClaimedTrancheTokens: string
  pendingRedeemTrancheTokens: string
  claimableCurrency: string
  sumClaimedCurrency: string
}

export type SubqueryCurrencyBalances = {
  __typename?: 'CurrencyBalances'
  id: string
  accountId: string
  currency: {
    trancheId: string | null
  }
  account: {
    chainId: string
    evmAddress?: string
  }
  amount: string
}

export type SubqueryOutstandingOrder = {
  timestamp: string
  poolId: string
  trancheId: string // poolId-trancheId
  hash: string
  redeemAmount: string
  investAmount: string
  tranche: {
    tokenPrice: string
  }
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
