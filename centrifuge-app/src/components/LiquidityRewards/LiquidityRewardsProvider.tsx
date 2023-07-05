import { Pool, TokenBalance } from '@centrifuge/centrifuge-js'
import { useBalances, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import Decimal from 'decimal.js-light'
import * as React from 'react'
import { Dec } from '../../utils/Decimal'
import { useAddress } from '../../utils/useAddress'
import { usePendingCollect, usePool } from '../../utils/usePools'
import {
  useAccountStakes,
  useClaimCountdown,
  useComputeLiquidityRewards,
  useEndOfEpoch,
  useRewardCurrencyGroup,
} from './hooks'
import { LiquidityRewardsContext } from './LiquidityRewardsContext'
import { LiquidityRewardsActions, LiquidityRewardsProviderProps, LiquidityRewardsState } from './types'

export function LiquidityRewardsProvider(props: LiquidityRewardsProviderProps) {
  const isTinlakePool = props.poolId.startsWith('0x')
  return !isTinlakePool ? <Provider {...props} /> : <>{props.children}</>
}

function Provider({ poolId, trancheId, children }: LiquidityRewardsProviderProps) {
  const pool = usePool(poolId) as Pool
  const address = useAddress()
  const order = usePendingCollect(poolId, trancheId, address)
  const stakes = useAccountStakes(address, poolId, trancheId)
  const rewards = useComputeLiquidityRewards(address, poolId, trancheId)
  const balances = useBalances(address)
  const endOfEpoch = useEndOfEpoch()
  const countdown = useClaimCountdown(endOfEpoch)
  const rewardCurrencyGroup = useRewardCurrencyGroup(poolId, trancheId)

  const trancheBalance =
    balances?.tranches.find((t) => t.poolId === poolId && t.trancheId === trancheId)?.balance.toDecimal() ?? Dec(0)
  const pendingRedeem = order?.remainingRedeemToken.toDecimal() ?? Dec(0)
  const payoutTokenAmount = order?.payoutTokenAmount.toDecimal() ?? Dec(0)
  const remainingRedeemToken = order?.remainingRedeemToken.toDecimal() ?? Dec(0)

  const redeemToken = order?.redeemToken.toDecimal() ?? Dec(0)

  const combinedStakes = !!stakes ? stakes.stake.toDecimal().add(stakes.pendingStake.toDecimal()) : null
  const stakeableAmount = trancheBalance
    .add(pendingRedeem)
    .add(payoutTokenAmount)
    .minus(redeemToken)
    .minus(remainingRedeemToken)
  const tranche = pool.tranches.find(({ id }) => id === trancheId)

  const enabled = !!rewardCurrencyGroup?.groupId
  const canStake = !stakeableAmount.isZero() && stakeableAmount.isPositive()
  const canUnstake = !!combinedStakes && !combinedStakes.isZero()
  const canClaim = !!rewards && !rewards?.isZero()

  const claim = useCentrifugeTransaction('Claim CFG liquidity rewards', (cent) => cent.rewards.claimLiquidityRewards)
  const stake = useCentrifugeTransaction('Stake tokens', (cent) => cent.rewards.stake)
  const unStake = useCentrifugeTransaction('Unstake tokens', (cent) => cent.rewards.unStake)

  const state: LiquidityRewardsState = {
    tranche,
    countdown,
    rewards,
    stakeableAmount,
    combinedStakes,
    enabled,
    canStake,
    canUnstake,
    canClaim,
    isLoading: {
      claim: claim.isLoading,
      stake: stake.isLoading,
      unStake: unStake.isLoading,
    },
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
