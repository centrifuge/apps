import { Box, Button, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { formatBalance } from '../../utils/formatting'
import { useLiquidityRewards } from './LiquidityRewardsContext'
// import { LightButton } from '../InvestRedeem/LightButton'

export function Staker() {
  const {
    state: { tranche, stakes, canUnstake, isLoading },
    actions: { unStake },
  } = useLiquidityRewards()

  return (
    <Box>
      {/* <Box p={2} borderTopLeftRadius="card" borderTopRightRadius="card" backgroundColor="secondarySelectedBackground">
        10000 USDC invested
      </Box>
      <LightButton>Stake</LightButton> */}
      {!!stakes && !stakes?.stake.isZero() && (
        <Text>Staked amount: {formatBalance(stakes!.stake, tranche?.currency?.symbol)}</Text>
      )}

      {canUnstake && (
        <Button onClick={() => unStake()} loading={isLoading}>
          unstake
        </Button>
      )}
    </Box>
  )
}
