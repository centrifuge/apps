import { Token } from '@centrifuge/centrifuge-js'
import Decimal from 'decimal.js-light'

export type LiquidityRewardsProviderProps = {
  poolId: string
  trancheId: string
  children: React.ReactNode
}

export type LiquidityRewardsState = {
  tranche: Token | undefined
  countdown: ClaimCountDown | null
  rewards: Decimal | null | undefined
  stakeableAmount: Decimal | null
  combinedStakes: Decimal | null
  enabled: boolean
  canStake: boolean
  canUnstake: boolean
  canClaim: boolean
  isLoading: {
    claim: boolean
    stake: boolean
    unStake: boolean
  }
}

export type LiquidityRewardsActions = {
  claim(): void
  stake(): void
  unStake(amount?: Decimal): void
}

export type LiquidityRewardsContextType = {
  state: LiquidityRewardsState
  actions: LiquidityRewardsActions
}

export type ClaimCountDown = string | null
