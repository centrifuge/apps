import { Box, Card, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Link } from 'react-router-dom'
import { nftMetadataSchema } from '../schemas'
import { parseMetadataUrl } from '../utils/parseMetadataUrl'
import { useCollection } from '../utils/useCollections'
import { useMetadata } from '../utils/useMetadata'
import { NFT } from '../utils/useNFTs'
import { Identity } from './Identity'

type Props = {
  nft: NFT
}

export const NFTCard: React.FC<Props> = ({ nft }) => {
  const { data: metadata } = useMetadata(nft?.metadataUri, nftMetadataSchema)
  const collection = useCollection(nft.collectionId)

  return (
    <Card as={Link} to={`/collection/${nft.collectionId}/object/${nft.id}`} variant="interactive" pb={[3, 4]}>
      <Stack gap={[2, 3]}>
        <Box
          bg="backgroundPage"
          style={{ aspectRatio: '1' }}
          borderTopLeftRadius="card"
          borderTopRightRadius="card"
          overflow="hidden"
        >
          {metadata?.image && (
            <Box
              as="img"
              alt={metadata?.description ?? ''}
              src={parseMetadataUrl(metadata?.image)}
              display="block"
              width="100%"
              height="100%"
              style={{ objectFit: 'cover' }}
            />
          )}
        </Box>
        <Box px={[2, 3]}>
          <Text as="h2" variant="heading2" style={{ wordBreak: 'break-word' }}>
            {metadata?.name ?? 'Unnamed NFT'}
          </Text>
          {collection?.owner && (
            <Text variant="label1">
              by <Identity address={collection.owner} />
            </Text>
          )}
        </Box>
      </Stack>
    </Card>
  )
}
