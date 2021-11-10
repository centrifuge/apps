import { Box, Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Footer } from '../components/Footer'
import { NFTCard } from '../components/NFTCard'
import { PageContainer } from '../components/PageContainer'
import { RouterLinkButton } from '../components/RouterLinkButton'

const MOCK_ITEMS = Array.from({ length: 6 })

export const CollectionPage: React.FC = () => {
  return (
    <PageContainer>
      <Stack gap={8} flex={1}>
        <Shelf justifyContent="space-between">
          <Shelf gap={[0, 1]} alignItems="baseline" flexWrap="wrap">
            <Text variant="headingLarge" as="h1">
              Collection 1
            </Text>
            <Text variant="heading3" color="textSecondary">
              by HeHh404lkj1819oRmz
            </Text>
          </Shelf>
          <Box flex="0 0 auto">
            <RouterLinkButton to="/collection/1/object/mint" variant="outlined">
              Mint NFT
            </RouterLinkButton>
          </Box>
        </Shelf>
        {MOCK_ITEMS.length ? (
          <Grid gap={[2, 3]} columns={[2, 3, 4, 5]} equalColumns>
            {MOCK_ITEMS.map((_, i) => (
              <NFTCard key={i} />
            ))}
          </Grid>
        ) : (
          <Shelf justifyContent="center" mt="15vh" textAlign="center">
            <Text variant="heading2" color="textSecondary">
              The collection does not contain any NFTs yet
            </Text>
          </Shelf>
        )}
        <Footer />
      </Stack>
    </PageContainer>
  )
}
