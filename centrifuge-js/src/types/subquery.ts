export type SubqueryPoolSnapshot = {
  __typename?: 'PoolSnapshot'
  id: string
  timestamp: string
  netAssetValue: number
  totalReserve: number
  availableReserve: number
  maxReserve: number
  totalDebt?: number | null
  totalBorrowed?: number | null
  totalRepaid?: number | null
  totalInvested?: number | null
  totalRedeemed?: number | null
}

export type SubqueryTrancheSnapshot = {
  __typename?: 'TrancheSnapshot'
  id: string
  trancheId: string
  timestamp: string
  supply?: number | null
  price?: number | null
  outstandingInvestOrders_: number
  outstandingRedeemOrders_: number
  fulfilledInvestOrders_: number
  fulfilledRedeemOrders_: number
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
