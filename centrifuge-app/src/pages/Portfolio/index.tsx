import { Box, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useTheme } from 'styled-components'
import { LayoutBase } from '../../components/LayoutBase'
import { BasePadding, BASE_PADDING } from '../../components/LayoutBase/BasePadding'
import { AssetAllocation } from '../../components/Portfolio/AssetAllocation'
import { CardPortfolioValue } from '../../components/Portfolio/CardPortfolioValue'
import { Holdings } from '../../components/Portfolio/Holdings'
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
  const address = useAddress()
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
        <BasePadding backgroundColor={theme.colors.backgroundSecondary} gap={4} pb={3}>
          <Stack as="header" gap={1}>
            <Text as="h1" variant="heading1">
              Your portfolio
            </Text>
            <Text as="p" variant="label1">
              Track and manage your portfolio
            </Text>
          </Stack>
          <CardPortfolioValue />
        </BasePadding>
        <Box pt={1} px={BASE_PADDING}>
          <Holdings address={address} canInvestRedeem={true} />
        </Box>
        <BasePadding gap={3}>
          <Transactions onlyMostRecent address={address} />
          <AssetAllocation address={address} />
        </BasePadding>
      </Stack>
    </>
  )
}
