import { Box, Divider, Grid, IconCheckInCircle, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { millisecondsToDays } from '../../utils/date'
import { formatBalance } from '../../utils/formatting'
import { useActiveEpochData } from './hooks'
import { LightButton } from './LightButton'
import { useLiquidityRewards } from './LiquidityRewardsContext'

export function LiquidityRewardsStaker() {
  const activeEpochData = useActiveEpochData()
  const rewardsDurationInDays = React.useMemo(
    () => (activeEpochData?.duration ? millisecondsToDays(activeEpochData?.duration) : undefined),
    [activeEpochData?.duration]
  )

  const {
    state: { tranche, combinedStakes, enabled, canStake, canUnstake, isLoading, stakeableAmount, nativeCurrency },
    actions: { stake, unstake },
  } = useLiquidityRewards()

  const hasStakes = !!combinedStakes && !combinedStakes?.isZero()

  return enabled && (hasStakes || canStake || canUnstake) ? (
    <Box>
      <Box p={2} borderTopLeftRadius="card" borderTopRightRadius="card" backgroundColor="secondarySelectedBackground">
        <Stack gap={2}>
          {hasStakes && (
            <Stack gap={1}>
              <Shelf gap={1}>
                <IconCheckInCircle size="iconSmall" />
                <Text as="strong" variant="body2" fontWeight={600}>
                  {formatBalance(combinedStakes!, tranche?.currency?.symbol)} staked
                </Text>
              </Shelf>

              <Text as="span" variant="body3">
                The stake will be rewarded after being in the system for a whole reward epoch
                {rewardsDurationInDays !== undefined ? (
                  <>
                    {' '}
                    of{' '}
                    <Text as="strong" variant="body3" fontWeight={600}>
                      {rewardsDurationInDays} day{rewardsDurationInDays > 1 ? 's' : ''}
                    </Text>
                  </>
                ) : (
                  ''
                )}
                {'. '}
                {nativeCurrency?.symbol || 'CFG'} rewards are distributed regulary after each reward epoch.
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
                Stake pool tokens to earn {nativeCurrency?.symbol || 'CFG'} rewards.
              </Text>
            </Stack>
          )}
        </Stack>
      </Box>

      <Grid mt="1px" gap="1px" columns={canStake && canUnstake ? 2 : 1}>
        {canStake && (
          <LightButton onClick={stake} $left $right={!canUnstake} disabled={isLoading.unstake || isLoading.stake}>
            <Text variant="body2" color="inherit">
              Stake
            </Text>
          </LightButton>
        )}
        {canUnstake && (
          <LightButton
            onClick={() => unstake()}
            $left={!canStake}
            $right
            disabled={isLoading.unstake || isLoading.stake}
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
