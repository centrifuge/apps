import { useAddress, useBalances, useCentrifugeConsts } from '@centrifuge/centrifuge-react'
import { Box, Grid, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useTheme } from 'styled-components'
import { formatBalance } from '../../utils/formatting'
import { useComputeLiquidityRewards } from '../LiquidityRewards/hooks'
import { Coins } from './Coins'

export function PortfolioRewards() {
  const { colors } = useTheme()
  const consts = useCentrifugeConsts()
  const address = useAddress()
  const balances = useBalances(address)

  const stakes = balances?.tranches.map(({ poolId, trancheId }) => ({ poolId, trancheId })) ?? []
  const rewards = useComputeLiquidityRewards(address, stakes)

  return (
    <Grid
      as="article"
      position="relative"
      p={2}
      gridTemplateColumns={`1fr minmax(60px, 120px)`}
      gap={1}
      borderRadius="card"
      borderStyle="solid"
      borderWidth={1}
      borderColor="borderSecondary"
      style={{
        boxShadow: `0px 3px 2px -2px ${colors.borderPrimary}`,
      }}
    >
      <Stack gap={2}>
        <Text as="h2" variant="heading2">
          CFG rewards
        </Text>

        <Stack as="dl" gap={1}>
          <Text as="dt" variant="body3">
            Claimable
          </Text>

          <Text as="dd" variant="heading2">
            {formatBalance(rewards, consts.chainSymbol, 2)}
          </Text>
        </Stack>
      </Stack>

      <Box mt={3} alignSelf="end">
        <Coins />
      </Box>
    </Grid>
  )
}
