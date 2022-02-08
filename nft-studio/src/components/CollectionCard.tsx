import { Collection } from '@centrifuge/centrifuge-js'
import { Box, Card, Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Link } from 'react-router-dom'
import { collectionMetadataSchema, nftMetadataSchema } from '../schemas'
import { parseMetadataUrl } from '../utils/parseMetadataUrl'
import { useCollectionNFTsPreview } from '../utils/useCollections'
import { useMetadata } from '../utils/useMetadata'
import { Identity } from './Identity'

type Props = {
  collection: Collection
}

export const CollectionCard: React.FC<Props> = ({ collection }) => {
  const { data: metadata } = useMetadata(collection.metadataUri, collectionMetadataSchema)
  const { data: previewNFTs } = useCollectionNFTsPreview(collection.id)
  const { id, admin } = collection

  return (
    <CollectionCardInner
      to={`/collection/${id}`}
      title={metadata?.name || 'Unnamed collection'}
      label={
        <>
          by <Identity address={admin} />
        </>
      }
      description={metadata?.description}
      previewNFTs={previewNFTs ?? undefined}
    />
  )
}

type InnerProps = {
  to: string
  title: string
  label?: React.ReactNode
  description?: string
  previewNFTs?: { id: string; metadataUri?: string }[]
}

export const CollectionCardInner: React.FC<InnerProps> = ({ to, title, label, description, previewNFTs }) => {
  return (
    <Card as={Link} display="block" height="100%" to={to} variant="interactive" p={3}>
      <Shelf gap={3} justifyContent="space-between" alignItems="flex-start">
        <Stack gap={3}>
          <div>
            <Text as="h2" variant="heading2" style={{ wordBreak: 'break-word' }}>
              {title}
            </Text>
            {label && <Text variant="label1">{label}</Text>}
          </div>
          <Text
            style={{
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              wordBreak: 'break-word',
            }}
          >
            {description}
          </Text>
        </Stack>
        <Grid columns={2} gap={1}>
          {Array.from({ length: 4 }, (_, i) => (
            <PreviewImage uri={previewNFTs?.[i]?.metadataUri} key={previewNFTs?.[i]?.metadataUri || i} />
          ))}
        </Grid>
      </Shelf>
    </Card>
  )
}

const PreviewImage: React.FC<{ uri?: string }> = ({ uri }) => {
  const { data } = useMetadata(uri, nftMetadataSchema)
  const [shown, setShown] = React.useState(false)
  return (
    <Box width="80px" height="80px" borderRadius={4} bg={uri ? 'placeholderBackground' : undefined} overflow="hidden">
      {data?.image && (
        <Box
          as="img"
          alt=""
          src={parseMetadataUrl(data.image)}
          display="block"
          width="100%"
          height="100%"
          style={{ objectFit: 'cover', transition: 'opacity 200ms', opacity: shown ? 1 : 0 }}
          onLoad={() => setShown(true)}
        />
      )}
    </Box>
  )
}
