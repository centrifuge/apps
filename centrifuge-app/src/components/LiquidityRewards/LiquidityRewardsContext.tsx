import * as React from 'react'
import { LiquidityRewardsContextType } from './types'

export const LiquidityRewardsContext = React.createContext<LiquidityRewardsContextType>({} as any)

export function useLiquidityRewards() {
  const ctx = React.useContext(LiquidityRewardsContext)
  if (!ctx) throw new Error('useLiquidityRewards must be used within LiquidityRewardsProvider')
  return ctx
}
