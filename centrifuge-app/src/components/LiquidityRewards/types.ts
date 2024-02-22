import { CurrencyMetadata, Token } from '@centrifuge/centrifuge-js'
import Decimal from 'decimal.js-light'

export type LiquidityRewardsProviderProps = {
  poolId: string
  trancheId: string
  children: React.ReactNode
}

export type LiquidityRewardsState = {
  tranche: Token | undefined
  rewards: Decimal | null | undefined
  stakeableAmount: Decimal | null
  combinedStakes: Decimal | null
  enabled: boolean
  canStake: boolean
  canUnstake: boolean
  canClaim: boolean
  nativeCurrency?: Pick<CurrencyMetadata, 'decimals' | 'symbol'>
  isLoading: {
    claim: boolean
    stake: boolean
    unstake: boolean
  }
}

export type LiquidityRewardsActions = {
  claim(): void
  stake(): void
  unstake(amount?: Decimal): void
}

export type LiquidityRewardsContextType = {
  state: LiquidityRewardsState
  actions: LiquidityRewardsActions
}

export type ClaimCountDown = string | null
