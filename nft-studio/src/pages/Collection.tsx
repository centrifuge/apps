import { Box, Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useRouteMatch } from 'react-router'
import { Footer } from '../components/Footer'
import { Identity } from '../components/Identity'
import { NFTCard } from '../components/NFTCard'
import { PageContainer } from '../components/PageContainer'
import { RouterLinkButton } from '../components/RouterLinkButton'
import { VisibilityChecker } from '../components/VisibilityChecker'
import { useWeb3 } from '../components/Web3Provider'
import { collectionMetadataSchema } from '../schemas'
import { useCollection } from '../utils/useCollections'
import { useMetadata } from '../utils/useMetadata'
import { useNFTs } from '../utils/useNFTs'
import { isSameAddress } from '../utils/web3'

export const CollectionPage: React.FC = () => {
  return (
    <PageContainer>
      <Collection />
    </PageContainer>
  )
}

const COUNT_PER_PAGE = 16

const Collection: React.FC = () => {
  const {
    params: { cid: collectionId },
  } = useRouteMatch<{ cid: string }>()
  const { selectedAccount } = useWeb3()
  const collection = useCollection(collectionId)
  const { data: metadata } = useMetadata(collection?.metadataUri, collectionMetadataSchema)
  const { data: nfts } = useNFTs(collectionId)
  const [shownCount, setShownCount] = React.useState(COUNT_PER_PAGE)

  return (
    <Stack gap={8} flex={1}>
      <Shelf gap={2} justifyContent="space-between">
        <Shelf gap={[0, 1]} alignItems="baseline" flexWrap="wrap">
          <Text variant="headingLarge" as="h1" style={{ wordBreak: 'break-word' }}>
            {metadata?.name || 'Unnamed collection'}
          </Text>
          {collection?.owner && (
            <Text variant="heading3" color="textSecondary">
              by <Identity address={collection.owner} clickToCopy />
            </Text>
          )}
        </Shelf>
        {isSameAddress(selectedAccount?.address, collection?.owner) && (
          <Box flex="0 0 auto">
            <RouterLinkButton to={`/collection/${collectionId}/object/mint`} variant="outlined">
              Mint NFT
            </RouterLinkButton>
          </Box>
        )}
      </Shelf>
      {nfts?.length ? (
        <>
          <Grid gap={[2, 3]} columns={[2, 3, 4, 5]} equalColumns>
            {nfts.slice(0, shownCount).map((nft, i) => (
              <NFTCard nft={nft} key={i} />
            ))}
          </Grid>
          {nfts.length > shownCount && (
            <VisibilityChecker marginTop={400} onEnter={() => setShownCount((count) => count + COUNT_PER_PAGE)} />
          )}
        </>
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
