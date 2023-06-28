import { Box, Divider, Grid, IconCheckInCircle, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { formatBalance } from '../../utils/formatting'
import { LightButton } from '../InvestRedeem/LightButton'
import { useActiveEpochData } from './hooks'
import { useLiquidityRewards } from './LiquidityRewardsContext'
import { getRewardsDurationInDays } from './utils'

export function Staker() {
  const activeEpochData = useActiveEpochData()
  const rewardsDurationInDays = React.useMemo(
    () => (activeEpochData?.duration ? getRewardsDurationInDays(activeEpochData?.duration) : undefined),
    [activeEpochData?.duration]
  )

  const {
    state: { tranche, stakes, canStake, canUnstake, isLoading, stakeableAmount },
    actions: { stake, unStake },
  } = useLiquidityRewards()

  const hasStakes = !!stakes && !stakes?.stake.isZero()

  return hasStakes || canStake || canUnstake ? (
    <Box>
      <Box p={2} borderTopLeftRadius="card" borderTopRightRadius="card" backgroundColor="secondarySelectedBackground">
        <Stack gap={2}>
          {hasStakes && (
            <Stack gap={1}>
              <Shelf gap={1}>
                <IconCheckInCircle size="iconSmall" />
                <Text as="strong" variant="body2" fontWeight={600}>
                  {formatBalance(stakes!.stake, tranche?.currency?.symbol)} staked
                </Text>
              </Shelf>

              <Text as="span" variant="body3">
                {rewardsDurationInDays
                  ? `CFG rewards are distributed approximately each ${rewardsDurationInDays} days`
                  : 'CFG rewards are distributed regulary after a fixed amount of executed blocks'}
              </Text>
            </Stack>
          )}

          {hasStakes && canStake && <Divider />}

          {canStake && (
            <Stack gap={1}>
              <Text as="strong" variant="body2" fontWeight={600}>
                {formatBalance(stakeableAmount!, tranche?.currency?.symbol)}
              </Text>
              <Text as="span" variant="body3">
                Stake pool tokens to earn CFG rewards.
              </Text>
            </Stack>
          )}
        </Stack>
      </Box>

      <Grid mt="1px" gap="1px" columns={canStake && canUnstake ? 2 : 1}>
        {canStake && (
          <LightButton onClick={stake} $left $right={!canUnstake} disabled={isLoading.unStake || isLoading.stake}>
            <Text variant="body2" color="inherit">
              Stake
            </Text>
          </LightButton>
        )}
        {canUnstake && (
          <LightButton
            onClick={() => unStake()}
            $left={!canStake}
            $right
            disabled={isLoading.unStake || isLoading.stake}
          >
            <Text variant="body2" color="inherit">
              Unstake
            </Text>
          </LightButton>
        )}
      </Grid>
    </Box>
  ) : null
}
