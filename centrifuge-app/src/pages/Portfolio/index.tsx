import { Box, Card, Grid, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Link } from 'react-router-dom'
import { AddressTokens } from '../../components/AddressTokens'
import { AddressTransactions } from '../../components/AddressTransactions'
import { PageWithSideBar } from '../../components/PageWithSideBar'
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
      <Box as="header">
        <Text as="h1">Your portfolio</Text>
        <Text as="p">Track and manage your portfolio</Text>
      </Box>

      {!!address ? (
        <>
          <Grid gridTemplateColumns={['2fr 1fr']} gap={4}>
            <Card as="article" height={100}>
              <Text as="h2">Portfolio stats</Text>
            </Card>

            <Card as="article" height={100}>
              <Text as="h2">CFG rewards</Text>
            </Card>
          </Grid>

          <Grid columns={2} equalColumns gap={4}>
            <Box as="article" height={100}>
              <Text as="h2">Allocation</Text>
            </Box>

            <Box as="article" height={100}>
              <Text as="h2">Transaction history</Text>
              <AddressTransactions count={4} />
              <Link to="portfolio/transactions">View all</Link>
            </Box>
          </Grid>

          <Box as="article">
            <Text as="h2">Token overview</Text>
            <AddressTokens />
          </Box>
        </>
      ) : (
        <Text as="strong">You need to connect your wallet to see your portfolio</Text>
      )}
    </Stack>
  )
}
