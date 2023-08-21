import { Pool, TokenBalance } from '@centrifuge/centrifuge-js'
import { useBalances, useCentrifugeConsts, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import Decimal from 'decimal.js-light'
import * as React from 'react'
import { Dec } from '../../utils/Decimal'
import { useAddress } from '../../utils/useAddress'
import { usePendingCollect, usePool } from '../../utils/usePools'
import { useAccountStakes, useComputeLiquidityRewards, useRewardCurrencyGroup } from './hooks'
import { LiquidityRewardsContext } from './LiquidityRewardsContext'
import { LiquidityRewardsActions, LiquidityRewardsProviderProps, LiquidityRewardsState } from './types'

export function LiquidityRewardsProvider(props: LiquidityRewardsProviderProps) {
  const isTinlakePool = props.poolId.startsWith('0x')
  return !isTinlakePool ? <Provider {...props} /> : <>{props.children}</>
}

function Provider({ poolId, trancheId, children }: LiquidityRewardsProviderProps) {
  const pool = usePool(poolId) as Pool
  const consts = useCentrifugeConsts()
  const address = useAddress()
  const order = usePendingCollect(poolId, trancheId, address)
  const stakes = useAccountStakes(address, poolId, trancheId)
  const rewards = useComputeLiquidityRewards(address, poolId, trancheId)
  const balances = useBalances(address)
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
  const unstake = useCentrifugeTransaction('Unstake tokens', (cent) => cent.rewards.unstake)

  const state: LiquidityRewardsState = {
    tranche,
    rewards,
    stakeableAmount,
    combinedStakes,
    enabled,
    canStake,
    canUnstake,
    canClaim,
    nativeCurrency: {
      symbol: consts.chainSymbol,
      decimals: consts.chainDecimals,
    },
    isLoading: {
      claim: claim.isLoading,
      stake: stake.isLoading,
      unstake: unstake.isLoading,
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
    unstake: (customAmount?: Decimal) => {
      const amount = customAmount ?? stakes?.stake.toDecimal()

      if (!pool.currency || !poolId || !trancheId || !amount) {
        return
      }

      const tokenbalance = TokenBalance.fromFloat(amount, pool.currency.decimals)
      unstake.execute([poolId, trancheId, tokenbalance])
    },
  }

  return <LiquidityRewardsContext.Provider value={{ state, actions }}>{children}</LiquidityRewardsContext.Provider>
}
