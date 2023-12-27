import { Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { LayoutBase } from '../../components/LayoutBase'
import { LayoutSection } from '../../components/LayoutBase/LayoutSection'
import { AssetAllocation } from '../../components/Portfolio/AssetAllocation'
import { CardPortfolioValue } from '../../components/Portfolio/CardPortfolioValue'
import { Holdings } from '../../components/Portfolio/Holdings'
import { Transactions } from '../../components/Portfolio/Transactions'
import { RouterLinkButton } from '../../components/RouterLinkButton'
import { useAddress } from '../../utils/useAddress'
import { useTransactionsByAddress } from '../../utils/usePools'

export default function PortfolioPage() {
  return (
    <LayoutBase gap={5}>
      <Portfolio />
    </LayoutBase>
  )
}

function Portfolio() {
  const address = useAddress()
  console.log('🚀 ~ address:', address)
  const transactions = useTransactionsByAddress(address)
  console.log('🚀 ~ transactions:', transactions?.investorTransactions)

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

      {transactions?.investorTransactions.length === 0 || !address ? (
        <LayoutSection>
          <Stack maxWidth="700px" gap={2}>
            <Text variant="body2">
              The portfolio page is empty as there are no investments available for display at the moment. Go explore
              some pools on Centrifuge, where you can earn yield from real-world assets.
            </Text>
            <RouterLinkButton style={{ display: 'inline-flex' }} variant="primary" to="/pools">
              View pools
            </RouterLinkButton>
          </Stack>
        </LayoutSection>
      ) : null}

      <LayoutSection title="Holdings">
        <Holdings address={address} />
      </LayoutSection>

      <LayoutSection title="Transaction history">
        <Transactions onlyMostRecent address={address} />
      </LayoutSection>

      <LayoutSection title="Allocation">
        <AssetAllocation address={address} />
      </LayoutSection>
    </>
  )
}
