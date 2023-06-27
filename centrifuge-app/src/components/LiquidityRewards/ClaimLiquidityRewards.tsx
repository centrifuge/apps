import { Box, Button, Card, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Dec } from '../../utils/Decimal'
import { formatBalance, formatBalanceAbbreviated } from '../../utils/formatting'
import { useLiquidityRewards } from './LiquidityRewardsContext'

export function ClaimLiquidityRewards() {
  const {
    state: { countdown, rewards, canClaim, isLoading },
    actions: { claim },
  } = useLiquidityRewards()

  const rewardsAmount =
    rewards && !rewards?.isZero()
      ? rewards.gte(Dec(10000))
        ? formatBalanceAbbreviated(rewards, 'CFG', 2)
        : formatBalance(rewards, 'CFG', 2)
      : '0 CFG'

  return !!rewards && !rewards?.isZero() ? (
    <Box as={Card} p={2} pb={3}>
      <Stack gap={2}>
        <Shelf justifyContent="space-between" flexWrap="wrap" gap={1}>
          <Text as="strong" variant="heading3">
            {rewardsAmount}
          </Text>
          <Button
            loading={isLoading.claim}
            loadingMessage="Claiming…"
            disabled={!canClaim}
            onClick={claim}
            variant="secondary"
            small
          >
            Claim
          </Button>
        </Shelf>

        {!!countdown && (
          <Text as="span" variant="body3">
            New rounds of rewards will be available in {countdown}
          </Text>
        )}
      </Stack>
    </Box>
  ) : null
}
