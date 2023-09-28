import { Card, Grid, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useTheme } from 'styled-components'
import { LayoutBase } from '../../components/LayoutBase'
import { BasePadding } from '../../components/LayoutBase/BasePadding'
import { PoolList } from '../../components/PoolList'
import { AssetAllocation } from '../../components/Portfolio/AssetAllocation'
import { InvestedTokens } from '../../components/Portfolio/InvestedTokens'
import { Rewards } from '../../components/Portfolio/Rewards'
import { Transactions } from '../../components/Portfolio/Transactions'
import { useAddress } from '../../utils/useAddress'

export function PortfolioPage() {
  return (
    <LayoutBase>
      <Portfolio />
    </LayoutBase>
  )
}

function Portfolio() {
  const address = useAddress('substrate')
  const theme = useTheme()

  if (!address) {
    return (
      <BasePadding>
        <Text as="strong">You need to connect your wallet to see your portfolio</Text>
      </BasePadding>
    )
  }
  return (
    <>
      <Stack gap={2}>
        <BasePadding backgroundColor={theme.colors.backgroundSecondary} gap={4} pb={10}>
          <Stack as="header" gap={1}>
            <Text as="h1" variant="heading1">
              Your portfolio
            </Text>
            <Text as="p" variant="label1">
              Track and manage your portfolio
            </Text>
          </Stack>

          <Grid gridTemplateColumns={['1.5fr 1fr']} gap={4}>
            <Card as="article" p={1}>
              <Text as="h2">Portfolio overview</Text>
            </Card>

            <Rewards />
          </Grid>
        </BasePadding>
        <BasePadding gap={3}>
          <InvestedTokens />
          <Transactions
            count={3}
            txTypes={['INVEST_EXECUTION', 'REDEEM_EXECUTION', 'INVEST_ORDER_UPDATE', 'REDEEM_ORDER_UPDATE']}
          />
          <AssetAllocation />
        </BasePadding>
        <BasePadding>
          <Stack as="article" gap={2}>
            <Text as="h2" variant="heading2">
              Explore opportunities
            </Text>
            <PoolList />
          </Stack>
        </BasePadding>
      </Stack>
    </>
  )
}
