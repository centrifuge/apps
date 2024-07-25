import { CurrencyBalance, Price, Rate } from '../utils/BN'

export type SubqueryPoolSnapshot = {
  id: string
  timestamp: string
  value: string
  netAssetValue: number
  totalReserve: number
  offchainCashValue: number
  portfolioValuation: number
  sumPoolFeesChargedAmountByPeriod: string | null
  sumPoolFeesAccruedAmountByPeriod: string | null
  sumPoolFeesPaidAmountByPeriod: string | null
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
  __typename?: 'AssetSnapshot'
  asset: {
    actualOriginationDate: number
    advanceRate: Rate
    collateralValue: string
    discountRate: Rate
    faceValue: CurrencyBalance | undefined
    id: string
    lossGivenDefault: Rate
    actualMaturityDate: number
    metadata: string
    name: string
    probabilityOfDefault: Rate
    status: string
    sumRealizedProfitFifo: CurrencyBalance | undefined
    type: AssetType
    unrealizedProfitAtMarketPrice: CurrencyBalance | undefined
    valuationMethod: string
    notional: CurrencyBalance | undefined
  }
  timestamp: Date
  assetId: string
  presentValue: CurrencyBalance | undefined
  currentPrice: CurrencyBalance | undefined
  outstandingPrincipal: CurrencyBalance | undefined
  outstandingInterest: CurrencyBalance | undefined
  outstandingDebt: CurrencyBalance | undefined
  outstandingQuantity: CurrencyBalance | undefined
  totalBorrowed: CurrencyBalance | undefined
  totalRepaidPrincipal: CurrencyBalance | undefined
  totalRepaidInterest: CurrencyBalance | undefined
  totalRepaidUnscheduled: CurrencyBalance | undefined
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
