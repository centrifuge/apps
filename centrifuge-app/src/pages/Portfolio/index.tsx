import { Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { LayoutBase } from '../../components/LayoutBase'
import { LayoutSection } from '../../components/LayoutBase/LayoutSection'
import { AssetAllocation } from '../../components/Portfolio/AssetAllocation'
import { CardPortfolioValue } from '../../components/Portfolio/CardPortfolioValue'
import { HoldingsSection } from '../../components/Portfolio/Holdings'
import { Transactions } from '../../components/Portfolio/Transactions'
import { useAddress } from '../../utils/useAddress'

export default function PortfolioPage() {
  return (
    <LayoutBase gap={5}>
      <Portfolio />
    </LayoutBase>
  )
}

function Portfolio() {
  const address = useAddress('substrate')

  return (
    <>
      <LayoutSection backgroundColor="backgroundSecondary" pt={5} pb={3}>
        <Stack as="header" gap={1}>
          <Text as="h1" variant="heading1">
            Your portfolio
          </Text>
          <Text as="p" variant="label1">
            Track and manage your portfolio
          </Text>
        </Stack>
        <CardPortfolioValue address={address} />
      </LayoutSection>
      <HoldingsSection address={address} />

      <LayoutSection title="Transaction history">
        <Transactions onlyMostRecent address={address} />
      </LayoutSection>

      <LayoutSection title="Allocation">
        <AssetAllocation address={address} />
      </LayoutSection>
    </>
  )
}
