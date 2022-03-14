import { NFT } from '@centrifuge/centrifuge-js'
import { Box, Card, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Link } from 'react-router-dom'
import { nftMetadataSchema } from '../schemas'
import { parseMetadataUrl } from '../utils/parseMetadataUrl'
import { useCollection } from '../utils/useCollections'
import { useMetadata } from '../utils/useMetadata'
import { useCentrifuge } from './CentrifugeProvider'
import { Identity } from './Identity'

type Props = {
  nft: NFT
}

export const NFTCard: React.FC<Props> = ({ nft }) => {
  const { data: metadata } = useMetadata(nft?.metadataUri, nftMetadataSchema)
  const collection = useCollection(nft.collectionId)
  const centrifuge = useCentrifuge()
  const [imageShown, setImageShown] = React.useState(false)

  return (
    <Card as={Link} to={`/collection/${nft.collectionId}/object/${nft.id}`} variant="interactive" pb={[3, 4]}>
      <Stack gap={[2, 3]}>
        <Box
          bg="placeholderBackground"
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
              style={{ objectFit: 'cover', transition: 'opacity 200ms', opacity: imageShown ? 1 : 0 }}
              onLoad={() => setImageShown(true)}
            />
          )}
        </Box>
        <Stack gap={1} px={[2, 3]}>
          <Text as="h2" variant="heading2" style={{ wordBreak: 'break-word' }}>
            {metadata?.name ?? 'Unnamed NFT'}
          </Text>
          <Shelf flexWrap="wrap" gap={1}>
            {collection?.owner && (
              <Box flexBasis="150px" mr="auto">
                <Text variant="label1">
                  <Shelf gap="4px">
                    <span>by</span>
                    <Identity address={collection.owner} />
                  </Shelf>
                </Text>
              </Box>
            )}
            {nft.sellPrice !== null && (
              <Box flexBasis="auto">
                <Text variant="heading3">{centrifuge.utils.formatCurrencyAmount(nft.sellPrice, 'AIR')}</Text>
              </Box>
            )}
          </Shelf>
        </Stack>
      </Stack>
    </Card>
  )
}
