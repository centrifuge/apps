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
