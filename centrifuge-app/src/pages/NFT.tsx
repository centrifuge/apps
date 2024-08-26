import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Box, Button, IconArrowRight, IconNft, Shelf, Stack, Text, TextWithPlaceholder } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router-dom'
import { TransferDialog } from '../components/Dialogs/TransferDialog'
import { Identity } from '../components/Identity'
import { PageHeader } from '../components/PageHeader'
import { PageSection } from '../components/PageSection'
import { AnchorPillButton } from '../components/PillButton'
import { nftMetadataSchema } from '../schemas'
import { useAddress } from '../utils/useAddress'
import { useCollection, useCollectionMetadata } from '../utils/useCollections'
import { useMetadata } from '../utils/useMetadata'
import { useCentNFT } from '../utils/useNFTs'
import { isSameAddress } from '../utils/web3'

export default function NFTPage() {
  return <NFT />
}

function NFT() {
  const { cid: collectionId, nftid: nftId } = useParams<{ cid: string; nftid: string }>()
  if (!collectionId || !nftId) throw new Error('NFT not found')
  const address = useAddress('substrate')
  const nft = useCentNFT(collectionId, nftId)
  const { data: nftMetadata, isLoading } = useMetadata(nft?.metadataUri, nftMetadataSchema)
  const collection = useCollection(collectionId)
  const { data: collectionMetadata } = useCollectionMetadata(collection?.id)
  const [transferOpen, setTransferOpen] = React.useState(false)
  const centrifuge = useCentrifuge()

  const imageUrl = nftMetadata?.image ? centrifuge.metadata.parseMetadataUrl(nftMetadata.image) : ''

  return (
    <Stack flex={1}>
      <Box>
        <PageHeader
          parent={{ label: collectionMetadata?.name ?? 'Collection', to: `/nfts/collection/${collectionId}` }}
          title={<TextWithPlaceholder isLoading={isLoading}>{nftMetadata?.name ?? 'Unnamed NFT'}</TextWithPlaceholder>}
          subtitle={
            collection && (
              <>
                by <Identity address={collection.owner} clickToCopy />
              </>
            )
          }
        />
      </Box>
      <PageSection>
        <Shelf alignItems="stretch" gap={4} flexWrap="wrap">
          <Box
            display="flex"
            alignItems="stretch"
            justifyContent="center"
            height="100%"
            flex="1 1 60%"
            style={{ aspectRatio: '1 / 1' }}
            position="relative"
          >
            {imageUrl ? (
              <Box
                as="img"
                width="100%"
                height="100%"
                src={imageUrl}
                position="absolute"
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <Box
                bg="borderPrimary"
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="10px"
                style={{ aspectRatio: '1 / 1' }}
              >
                <IconNft color="backgroundPrimary" size="50%" />
              </Box>
            )}
          </Box>
          <Stack gap={3} flex="1 1 30%" minWidth={250}>
            {!nft && (
              <Stack gap={3}>
                <Text variant="heading3" as="h12">
                  NFT Not Found
                </Text>
              </Stack>
            )}
            {nft && collection && (
              <>
                <Stack gap={1}>
                  <Text variant="label1">Description</Text>
                  <TextWithPlaceholder
                    isLoading={isLoading}
                    words={2}
                    width={80}
                    variance={30}
                    variant="body2"
                    style={{ wordBreak: 'break-word' }}
                  >
                    {nftMetadata?.description || 'No description'}
                  </TextWithPlaceholder>
                </Stack>

                {imageUrl && (
                  <Stack gap={1} alignItems="flex-start">
                    <Text variant="label1">Image</Text>
                    <AnchorPillButton
                      href={imageUrl}
                      target="_blank"
                      style={{ wordBreak: 'break-all', whiteSpace: 'initial' }}
                    >
                      Source file
                    </AnchorPillButton>
                  </Stack>
                )}

                <Stack gap={1}>
                  <Text variant="label1">Owner</Text>
                  <Text variant="label2" color="textPrimary">
                    <Identity address={nft.owner} clickToCopy />
                  </Text>
                </Stack>
              </>
            )}

            <Stack gap={1} alignItems="start">
              {nft &&
                address &&
                (isSameAddress(nft.owner, address) ? (
                  <>
                    <Button onClick={() => setTransferOpen(true)} icon={IconArrowRight} small variant="secondary">
                      Transfer
                    </Button>
                    <TransferDialog
                      collectionId={collectionId}
                      nftId={nftId}
                      open={transferOpen}
                      onClose={() => setTransferOpen(false)}
                    />
                  </>
                ) : null)}
            </Stack>
          </Stack>
        </Shelf>
      </PageSection>
    </Stack>
  )
}
