import { Card, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useTheme } from 'styled-components'
import { LayoutBase } from '../../components/LayoutBase'
import { BasePadding } from '../../components/LayoutBase/BasePadding'
import { PoolList } from '../../components/PoolList'
import { AssetAllocation } from '../../components/Portfolio/AssetAllocation'
import { InvestedTokens } from '../../components/Portfolio/InvestedTokens'
import { Transactions } from '../../components/Portfolio/Transactions'
import { useAddress } from '../../utils/useAddress'

export default function PortfolioPage() {
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

          <Shelf>
            <Card as="article" p={1}>
              <Text as="h2">Portfolio overview</Text>
            </Card>
          </Shelf>
        </BasePadding>
        <BasePadding gap={3}>
          <InvestedTokens address={address} />
          <Transactions onlyMostRecent address={address} />
          <AssetAllocation address={address} />
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
