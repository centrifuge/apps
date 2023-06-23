import { Pool, TokenBalance } from '@centrifuge/centrifuge-js'
import { useBalances, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import Decimal from 'decimal.js-light'
import * as React from 'react'
import { Dec } from '../../utils/Decimal'
import { useAddress } from '../../utils/useAddress'
import { usePendingCollect, usePool } from '../../utils/usePools'
import { useAccountStakes, useComputeLiquidityRewards } from './hooks'
import { LiquidityRewardsContext } from './LiquidityRewardsContext'
import { LiquidityRewardsActions, LiquidityRewardsProviderProps, LiquidityRewardsState } from './types'

export function LiquidityRewardsProvider({ poolId, trancheId, children }: LiquidityRewardsProviderProps) {
  const pool = usePool(poolId) as Pool
  const address = useAddress()
  const order = usePendingCollect(poolId, trancheId, address)
  const stakes = useAccountStakes(address, poolId, trancheId)
  const rewards = useComputeLiquidityRewards(address, poolId, trancheId)
  const balances = useBalances(address)

  const trancheBalance =
    balances?.tranches.find((t) => t.poolId === poolId && t.trancheId === trancheId)?.balance.toDecimal() ?? Dec(0)
  const stakedAmount = stakes?.stake.toDecimal() ?? Dec(0)
  const pendingRedeem = order?.remainingRedeemToken.toDecimal() ?? Dec(0)
  const payoutTokenAmount = order?.payoutTokenAmount.toDecimal() ?? Dec(0)
  const stakeableAmount = trancheBalance.add(pendingRedeem).add(payoutTokenAmount).minus(stakedAmount)

  const canStake = !stakeableAmount.isZero()
  const canUnstake = !stakes?.stake.isZero()
  const canClaim = !!rewards && !rewards?.isZero()

  const claim = useCentrifugeTransaction('Claim CFG liquidity rewards', (cent) => cent.rewards.claimLiquidityRewards)
  const stake = useCentrifugeTransaction('Stake tokens', (cent) => cent.rewards.stake)
  const unStake = useCentrifugeTransaction('Unstake tokens', (cent) => cent.rewards.unStake)

  const state: LiquidityRewardsState = {
    rewards,
    stakes,
    canStake,
    canUnstake,
    canClaim,
    isLoading: claim.isLoading || stake.isLoading || unStake.isLoading,
  }

  const actions: LiquidityRewardsActions = {
    claim: () => {
      if (!poolId || !trancheId) {
        return
      }

      claim.execute([poolId, trancheId])
    },
    stake: () => {
      if (!pool.currency || !order || !order.payoutTokenAmount || !trancheId) {
        return
      }

      const tokenbalance = TokenBalance.fromFloat(stakeableAmount, pool.currency.decimals)
      stake.execute([poolId, trancheId, tokenbalance])
    },
    unStake: (customAmount?: Decimal) => {
      const amount = customAmount ?? stakes?.stake.toDecimal()

      if (!pool.currency || !poolId || !trancheId || !amount) {
        return
      }

      const tokenbalance = TokenBalance.fromFloat(amount, pool.currency.decimals)
      unStake.execute([poolId, trancheId, tokenbalance])
    },
  }

  return <LiquidityRewardsContext.Provider value={{ state, actions }}>{children}</LiquidityRewardsContext.Provider>
}
