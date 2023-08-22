import { useBalances } from '@centrifuge/centrifuge-react'
import { Box, Card, Grid, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Link } from 'react-router-dom'
import { AddressAllocation } from '../../components/AddressAllocation'
import { AddressTokens } from '../../components/AddressTokens'
import { AddressTransactions } from '../../components/AddressTransactions'
import { PageWithSideBar } from '../../components/PageWithSideBar'
import { PoolList } from '../../components/PoolList'
import { PortfolioRewards } from '../../components/PortfolioRewards'
import { useAddress } from '../../utils/useAddress'
import { useListedPools } from '../../utils/useListedPools'

export function PortfolioPage() {
  return (
    <PageWithSideBar>
      <Portfolio />
    </PageWithSideBar>
  )
}

function Portfolio() {
  const address = useAddress()
  const balances = useBalances(address)
  const showFallback = !balances?.tranches.length && !balances?.currencies.length

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

          {showFallback ? (
            <Fallback />
          ) : (
            <>
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

              <Box as="article">
                <Text as="h2" variant="heading2">
                  Allocation
                </Text>
                <AddressAllocation />
              </Box>
            </>
          )}
        </>
      ) : (
        <Text as="strong">You need to connect your wallet to see your portfolio</Text>
      )}
    </Stack>
  )
}

function Fallback() {
  const [listedPools, , metadataIsLoading] = useListedPools()

  return (
    <Stack as="article">
      <Text as="h2" variant="heading2">
        Explore opportunities
      </Text>
      <PoolList pools={listedPools.filter(({ reserve }) => reserve.max.toFloat() > 0)} isLoading={metadataIsLoading} />
    </Stack>
  )
}
