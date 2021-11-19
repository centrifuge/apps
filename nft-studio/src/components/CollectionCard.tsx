import { Box, Card, Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Link } from 'react-router-dom'
import { parseMetadataUrl } from '../utils/parseMetadataUrl'
import { Collection, useCollectionNFTsPreview } from '../utils/useCollections'
import { useMetadata } from '../utils/useMetadata'
import { Identity } from './Identity'

type Props = {
  collection: Collection
}

export const CollectionCard: React.FC<Props> = ({ collection }) => {
  const { data: metadata } = useMetadata<{ name: string; description: string }>(collection.metadataUri)
  const { data: previewNFTs } = useCollectionNFTsPreview(collection.id)
  const { id, admin } = collection

  return (
    <CollectionCardInner
      to={`/collection/${id}`}
      title={metadata?.name ?? 'Unnamed collection'}
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
            <Text as="h2" variant="heading2">
              {title}
            </Text>
            {label && <Text variant="label1">{label}</Text>}
          </div>
          <Text>{description}</Text>
        </Stack>
        <Grid columns={2} gap={1}>
          {Array.from({ length: 4 }, (_, i) => (
            <PreviewImage uri={previewNFTs?.[i]?.metadataUri} key={i} />
          ))}
        </Grid>
      </Shelf>
    </Card>
  )
}

const PreviewImage: React.FC<{ uri?: string }> = ({ uri }) => {
  const { data } = useMetadata<{ image: string }>(uri)
  return (
    <Box width="80px" height="80px" borderRadius={4} overflow="hidden">
      {data?.image && (
        <Box
          as="img"
          alt=""
          src={parseMetadataUrl(data.image)}
          display="block"
          width="100%"
          height="100%"
          style={{ objectFit: 'cover' }}
        />
      )}
    </Box>
  )
}
