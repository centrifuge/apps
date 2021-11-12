import { Box, Card, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Link } from 'react-router-dom'
import { parseMetadataUrl } from '../utils/parseMetadataUrl'
import { useMetadata } from '../utils/useMetadata'
import { NFT } from '../utils/useNFTs'
import { truncateAddress } from '../utils/web3'

type Props = {
  nft: NFT
}

export const NFTCard: React.FC<Props> = ({ nft }) => {
  const { data: metadata } = useMetadata<{ name: string; description: string; image: string }>(nft?.metadataUri)
  return (
    <Card as={Link} to="/collection/1/object/2" variant="interactive" pb={[3, 4]}>
      <Stack gap={[2, 3]}>
        <Box bg="backgroundPage" style={{ aspectRatio: '1' }}>
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
          <Text as="h2" variant="heading2">
            {metadata?.name ?? 'Test NFT'}
          </Text>
          <Text variant="label1">by {truncateAddress(nft.owner)}</Text>
        </Box>
      </Stack>
    </Card>
  )
}
