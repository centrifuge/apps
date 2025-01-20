import { CurrencyBalance, Price } from '../utils/BN'

export type SubqueryPoolSnapshot = {
  id: string
  timestamp: string
  value: string
  netAssetValue: number
  totalReserve: number
  offchainCashValue: number
  portfolioValuation: number
  sumPoolFeesChargedAmountByPeriod: string
  sumPoolFeesAccruedAmountByPeriod: string
  sumPoolFeesPaidAmountByPeriod: string
  sumBorrowedAmountByPeriod: string
  sumPrincipalRepaidAmountByPeriod: string
  sumInterestRepaidAmountByPeriod: string
  sumUnscheduledRepaidAmountByPeriod: string
  sumRepaidAmountByPeriod: string
  sumInvestedAmountByPeriod: string
  sumRedeemedAmountByPeriod: string
  blockNumber: number
  sumPoolFeesPendingAmount: string
  sumDebtWrittenOffByPeriod: string
  sumInterestAccruedByPeriod: string
  sumRealizedProfitFifoByPeriod: string
  sumUnrealizedProfitAtMarketPrice: string
  sumUnrealizedProfitAtNotional: string
  sumUnrealizedProfitByPeriod: string
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
  yield7DaysAnnualized: string
  yield30DaysAnnualized: string
  yield90DaysAnnualized: string
  yieldSinceInception: string
  yieldMTD: string
  yieldQTD: string
  yieldYTD: string
  yieldSinceLastPeriod: string
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

export type AssetTransactionType =
  | 'CREATED'
  | 'PRICED'
  | 'BORROWED'
  | 'REPAID'
  | 'CLOSED'
  | 'CASH_TRANSFER'
  | 'DEPOSIT_FROM_INVESTMENTS'
  | 'WITHDRAWAL_FOR_REDEMPTIONS'
  | 'WITHDRAWAL_FOR_FEES'
  | 'INCREASE_DEBT'
  | 'DECREASE_DEBT'

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
  realizedProfitFifo: CurrencyBalance | undefined
  asset: {
    id: string
    metadata: string
    name: string
    type: AssetType
    sumRealizedProfitFifo: string
    unrealizedProfitAtMarketPrice: string
    currentPrice: string
  }
  fromAsset?: {
    id: string
    metadata: string
    name: string
    type: AssetType
  }
  toAsset?: {
    id: string
    metadata: string
    name: string
    type: AssetType
  }
}

export type SubqueryAssetSnapshot = {
  __typename?: 'allAssetSnapshots'
  asset: {
    actualOriginationDate: number
    advanceRate: string | undefined
    collateralValue: string | undefined
    discountRate: string | undefined
    id: string
    lossGivenDefault: string | undefined
    actualMaturityDate: string | undefined
    name: string
    probabilityOfDefault: string | undefined
    status: string
    sumRealizedProfitFifo: string | undefined
    unrealizedProfitAtMarketPrice: string | undefined
    valuationMethod: string
    notional: string | undefined
  }
  timestamp: string
  assetId: string
  presentValue: string | undefined
  currentPrice: string | undefined
  outstandingPrincipal: string | undefined
  outstandingInterest: string | undefined
  outstandingDebt: string | undefined
  outstandingQuantity: string | undefined
  totalRepaidPrincipal: string | undefined
  totalRepaidInterest: string | undefined
  totalRepaidUnscheduled: string | undefined
}

export type SubqueryPoolAssetSnapshot = {
  __typename?: 'AssetSnapshot'
  timestamp: string | undefined
  assetId: string
  presentValue: string | undefined
  currentPrice: string | undefined
  outstandingPrincipal: string | undefined
  outstandingInterest: string | undefined
  outstandingDebt: string | undefined
  outstandingQuantity: string | undefined
  totalBorrowed: string | undefined
  totalRepaidPrincipal: string | undefined
  totalRepaidInterest: string | undefined
  totalRepaidUnscheduled: string | undefined
}

export type SubqueryPoolOrdersById = {
  __typename?: 'Epoches'
  id: string
  sumPoolFeesPaidAmount: string
  closedAt: string
  epochStates: {
    nodes: {
      tokenPrice: string
      sumOutstandingInvestOrders: string
      sumFulfilledInvestOrders: string
      sumOutstandingRedeemOrders: string
      sumFulfilledRedeemOrders: string
    }[]
  }
  poolSnapshots: {
    nodes: {
      netAssetValue: string
    }[]
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

export type SubqueryOracleTransaction = {
  __typename?: 'OracleTransaction'
  id: string
  timestamp: string
  key: string
  value: string
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

// incomplete types
export type SubqueryPoolFeeSnapshot = {
  poolFeeId: string // poolId-feeId
  timestamp: string
  sumPaidAmount: string
  sumChargedAmount: string
  sumAccruedAmount: string
  pendingAmount: string
  sumPaidAmountByPeriod: string
  sumChargedAmountByPeriod: string
  sumAccruedAmountByPeriod: string
  poolFee: {
    name: string
  }
}
