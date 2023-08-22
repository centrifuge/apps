import { Box, Button, Card, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Dec } from '../../utils/Decimal'
import { formatBalance, formatBalanceAbbreviated } from '../../utils/formatting'
import { useClaimCountdown } from './hooks'
import { useLiquidityRewards } from './LiquidityRewardsContext'

export function LiquidityRewardsClaimer() {
  const {
    state: { rewards, canClaim, isLoading, nativeCurrency },
    actions: { claim },
  } = useLiquidityRewards()
  const claimCountdown = useClaimCountdown()

  const rewardsAmount =
    rewards && !rewards?.isZero()
      ? rewards.gte(Dec(10000))
        ? formatBalanceAbbreviated(rewards, nativeCurrency?.symbol, 2)
        : formatBalance(rewards, nativeCurrency?.symbol, 2)
      : `0 ${nativeCurrency?.symbol || 'CFG'}`

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

        {!!claimCountdown && (
          <Text as="span" variant="body3">
            New rounds of rewards will be available in {claimCountdown}
          </Text>
        )}
      </Stack>
    </Box>
  ) : null
}
