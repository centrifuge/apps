import { Card, Stack } from '@centrifuge/fabric'
import * as React from 'react'
import { LiquidityRewardsClaimer } from './LiquidityRewardsClaimer'
import { useLiquidityRewards } from './LiquidityRewardsContext'
import { LiquidityRewardsStaker } from './LiquidityRewardsStaker'

export function LiquidityRewardsContainer() {
  const {
    state: { enabled, rewards, combinedStakes, canStake, canUnstake },
  } = useLiquidityRewards()

  return (!!rewards && !rewards?.isZero()) || (enabled && (!combinedStakes?.isZero() || canStake || canUnstake)) ? (
    <Stack as={Card} gap={2} p={2}>
      <LiquidityRewardsClaimer />
      <LiquidityRewardsStaker />
    </Stack>
  ) : null
}
