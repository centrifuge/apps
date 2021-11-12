import { Box, Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import { TextVariantName } from '@centrifuge/fabric/dist/theme'
import * as React from 'react'
import { useRouteMatch } from 'react-router'
import { Footer } from '../components/Footer'
import { NFTCard } from '../components/NFTCard'
import { PageContainer } from '../components/PageContainer'
import { RouterLinkButton } from '../components/RouterLinkButton'
import { useCollection } from '../utils/useCollections'
import { useMetadata } from '../utils/useMetadata'
import { useNFTs } from '../utils/useNFTs'
import { truncateAddress } from '../utils/web3'

export const CollectionPage: React.FC = (props) => {
  return (
    <PageContainer>
      <Collection />
    </PageContainer>
  )
}

const Collection: React.FC = () => {
  const {
    params: { cid: collectionId },
  } = useRouteMatch<{ cid: string }>()

  const collection = useCollection(collectionId)
  const { data: metadata } = useMetadata<{ name: string }>(collection?.metadataUri)
  const { data: nfts } = useNFTs(collectionId)

  return (
    <Stack gap={8} flex={1}>
      <Shelf justifyContent="space-between">
        <Shelf gap={[0, 1]} alignItems="baseline" flexWrap="wrap">
          <Text variant={'headingLarge' as TextVariantName} as="h1">
            {metadata?.name}
          </Text>
          {collection?.admin && (
            <Text variant="heading3" color="textSecondary">
              by {truncateAddress(collection?.admin)}
            </Text>
          )}
        </Shelf>
        <Box flex="0 0 auto">
          <RouterLinkButton to={`/collection/${collectionId}/object/mint`} variant="outlined">
            Mint NFT
          </RouterLinkButton>
        </Box>
      </Shelf>
      {nfts?.length ? (
        <Grid gap={[2, 3]} columns={[2, 3, 4, 5]} equalColumns>
          {nfts?.map((nft, i) => (
            <NFTCard nft={nft} key={i} />
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
  )
}
