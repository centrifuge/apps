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

  return !!rewards && !rewards?.isZero() ? (
    <Box as={Card} p={2} pb={3}>
      <Shelf justifyContent="space-between" flexWrap="wrap" gap={1}>
        <Stack>
          <Text as="span" variant="body3">
            {countdown && countdown.message ? `Claimable rewards in ${countdown.message} days` : 'Claimable rewards'}
          </Text>
          <Text as="strong" variant="heading3">
            {rewards.gte(Dec(10000)) ? formatBalanceAbbreviated(rewards, 'CFG', 2) : formatBalance(rewards, 'CFG', 2)}
          </Text>
        </Stack>
        <Button loading={isLoading} disabled={!canClaim} onClick={claim} small>
          Claim
        </Button>
      </Shelf>
    </Box>
  ) : null
}
