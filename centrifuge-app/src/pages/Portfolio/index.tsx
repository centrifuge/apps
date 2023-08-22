import { Box, Card, Grid, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Link } from 'react-router-dom'
import { AddressTokens } from '../../components/AddressTokens'
import { AddressTransactions } from '../../components/AddressTransactions'
import { PageWithSideBar } from '../../components/PageWithSideBar'
import { PortfolioRewards } from '../../components/PortfolioRewards'
import { useAddress } from '../../utils/useAddress'

export function PortfolioPage() {
  return (
    <PageWithSideBar>
      <Portfolio />
    </PageWithSideBar>
  )
}

function Portfolio() {
  const address = useAddress()

  return (
    <Stack gap={4}>
      <Stack as="header" gap={1}>
        <Text as="h1" variant="heading1">
          Your portfolio
        </Text>
        <Text as="p" variant="label1">
          Track and manage your portfolio
        </Text>
      </Stack>

      {!!address ? (
        <>
          <Grid gridTemplateColumns={['1.5fr 1fr']} gap={4}>
            <Card as="article">
              <Text as="h2">Portfolio stats</Text>
            </Card>

            <PortfolioRewards />
          </Grid>

          <Box as="article">
            <Text as="h2" variant="heading2">
              Token overview
            </Text>
            <AddressTokens />
          </Box>

          <Stack as="article" gap={2}>
            <Text as="h2" variant="heading2">
              Transaction history
            </Text>
            <AddressTransactions count={3} />
            <Link to="portfolio/transactions">View all</Link>
          </Stack>

          <Box as="article" height={100}>
            <Text as="h2">Allocation</Text>
          </Box>
        </>
      ) : (
        <Text as="strong">You need to connect your wallet to see your portfolio</Text>
      )}
    </Stack>
  )
}
