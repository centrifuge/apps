import { Token, TokenBalance } from '@centrifuge/centrifuge-js'
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
  stakes:
    | {
        stake: TokenBalance
        rewardTally: number
        lastCurrencyMovement: number
      }
    | undefined
    | null
  canStake: boolean
  canUnstake: boolean
  canClaim: boolean
  isLoading: boolean
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

export type ClaimCountDown =
  | {
      days: null
      hours: null
      minutes: null
      seconds: null
      message: null
    }
  | {
      days: number
      hours: number
      minutes: number
      seconds: number
      message: string
    }
