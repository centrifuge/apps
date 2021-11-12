import { Box, Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useRouteMatch } from 'react-router'
import { Footer } from '../components/Footer'
import { NFTCard } from '../components/NFTCard'
import { PageContainer } from '../components/PageContainer'
import { RouterLinkButton } from '../components/RouterLinkButton'
import { useCollectionMetadata } from '../utils/useCollections'

const MOCK_ITEMS = Array.from({ length: 6 })

export const CollectionPage: React.FC = (props) => {
  const {
    params: { cid: collectionId },
  } = useRouteMatch<{ cid: string }>()

  const { data: metadata } = useCollectionMetadata(collectionId)

  return (
    <PageContainer>
      <Stack gap={8} flex={1}>
        <Shelf justifyContent="space-between">
          <Shelf gap={[0, 1]} alignItems="baseline" flexWrap="wrap">
            <Text variant="headingLarge" as="h1">
              {metadata?.name}
            </Text>
            <Text variant="heading3" color="textSecondary">
              {metadata?.description}
            </Text>
          </Shelf>
          <Box flex="0 0 auto">
            <RouterLinkButton to={`/collection/${collectionId}/object/mint`} variant="outlined">
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
