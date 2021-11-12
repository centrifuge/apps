import { Box, Card, Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Link } from 'react-router-dom'
import { parseMetadataUrl } from '../utils/parseMetadataUrl'
import { Collection, useCollectionNFTsPreview } from '../utils/useCollections'
import { useMetadata } from '../utils/useMetadata'
import { truncateAddress } from '../utils/web3'

type Props = {
  collection: Collection
}

export const CollectionCard: React.FC<Props> = ({ collection }) => {
  const { data: metadata } = useMetadata(collection.metadataUri)
  const { data: previewImages } = useCollectionNFTsPreview(collection.id)
  const { id, admin } = collection

  return (
    <Card as={Link} display="block" height="100%" to={`/collection/${id}`} variant="interactive" p={3}>
      <Shelf gap={3} justifyContent="space-between" alignItems="flex-start">
        <Stack gap={3}>
          <div>
            <Text as="h2" variant="heading2">
              {metadata?.name ?? 'Unnamed collection'}
            </Text>
            <Text variant="label1">By {truncateAddress(admin)}</Text>
          </div>
          <Text>{metadata?.description}</Text>
        </Stack>
        <Grid columns={2} gap={1}>
          {Array.from({ length: 4 }, (_, i) => (
            <PreviewImage uri={previewImages?.[i]?.imageUri} key={i} />
          ))}
        </Grid>
      </Shelf>
    </Card>
  )
}

const PreviewImage: React.FC<{ uri?: string }> = ({ uri }) => {
  const { data } = useMetadata(uri)
  return (
    <Box bg="#eee" width="80px" height="80px" borderRadius={4} overflow="hidden">
      {data?.image && (
        <Box
          border="none"
          as="img"
          src={parseMetadataUrl(data.image)}
          width="100%"
          height="100%"
          style={{ objectFit: 'cover' }}
        />
      )}
    </Box>
  )
}
