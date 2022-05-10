export type SubqueryTrancheState = {
  __typename?: 'TrancheState'
  id: string
  poolState: SubqueryPoolState
  supply: number
  price: number
  outstandingInvestOrders: number
  outstandingRedeemOrders: number
  yield30Days?: number | null
  yield90Days?: number | null
  yieldSinceInception?: number | null
}

export type SubqueryPoolState = {
  __typename?: 'PoolState'
  id: string
  netAssetValue: number
  totalReserve: number
  availableReserve: number
  maxReserve: number
  totalDebt?: number | null
  trancheStates?: Array<SubqueryTrancheState | null> | null
}

export type SubqueryDailyPoolState = {
  __typename?: 'DailyPoolState'
  id: string
  timestamp: string
  poolState: SubqueryPoolState
  totalBorrowed?: number | null
  totalRepaid?: number | null
  totalInvested?: number | null
  totalRedeemed?: number | null
}
