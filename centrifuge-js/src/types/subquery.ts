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
}

export type SubqueryTrancheSnapshot = {
  __typename?: 'TrancheSnapshot'
  id: string
  price: string
  blockNumber: number
  timestamp: string
  trancheId: string // poolId-trancheId
  tranche: {
    poolId: string
    trancheId: string
  }
}
