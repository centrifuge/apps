import { Box, Button, IconArrowLeft, IconX, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Link, useHistory, useParams } from 'react-router-dom'
import { Identity } from '../components/Identity'
import { SplitView } from '../components/SplitView'
import { TransferDialog } from '../components/TransferDialog'
import { useWeb3 } from '../components/Web3Provider'
import { nftMetadataSchema } from '../schemas'
import { parseMetadataUrl } from '../utils/parseMetadataUrl'
import { useCollection, useCollectionMetadata } from '../utils/useCollections'
import { useMetadata } from '../utils/useMetadata'
import { useNFT } from '../utils/useNFTs'
import { isSameAddress } from '../utils/web3'

export const NFTPage: React.FC = () => {
  const { cid: collectionId, nftid: nftId } = useParams<{ cid: string; nftid: string }>()

  const { selectedAccount } = useWeb3()
  const nft = useNFT(collectionId, nftId)
  const { data: metadata } = useMetadata(nft?.metadataUri, nftMetadataSchema)
  const collection = useCollection(collectionId)
  const { data: collectionMetadata } = useCollectionMetadata(collection?.id)
  const [transferOpen, setTransferOpen] = React.useState(false)
  const history = useHistory()

  const imageUrl = parseMetadataUrl(metadata?.image || '')

  return (
    <SplitView
      left={
        <Box display="flex" alignItems="center" justifyContent="center" py={8} height="100%">
          <Box as="img" maxHeight="80vh" src={imageUrl} />
        </Box>
      }
      right={
        <Shelf
          px={[2, 4, 8]}
          py={9}
          gap={[4, 4, 8]}
          alignItems="flex-start"
          justifyContent="space-between"
          flexDirection={['column', 'row', 'column']}
        >
          <Box position="absolute" top={2} right={3}>
            <Button variant="text" icon={IconX} onClick={() => history.goBack()} />
          </Box>
          {!nft && (
            <Stack gap={3}>
              {collectionMetadata && collection && (
                <Box display={['none', 'none', 'block']}>
                  <Link to={`/collection/${collection.id}`}>
                    <Text fontWeight={600}>
                      <u>{collectionMetadata.name}</u>
                    </Text>
                  </Link>
                </Box>
              )}
              <Text variant="headingLarge" as="h1">
                NFT Not Found
              </Text>
            </Stack>
          )}
          {nft && imageUrl && metadata && collection && collectionMetadata && (
            <>
              <Stack gap={3}>
                <Box display={['none', 'none', 'block']}>
                  <Link to={`/collection/${collection.id}`}>
                    <Text fontWeight={600}>
                      <u>{collectionMetadata.name}</u>
                    </Text>
                  </Link>
                </Box>
                <Stack>
                  <Text variant="headingLarge" as="h1">
                    {metadata.name}
                  </Text>
                  <Text variant="heading3" color="textSecondary">
                    by <Identity address={collection.owner} clickToCopy />
                  </Text>
                </Stack>
              </Stack>
              <Stack gap={3}>
                {/* <Stack>
                  <Text variant="label1">Creation date</Text>
                  <Text variant="heading3">
                    {metadata.createdAt &&
                      new Date(metadata.createdAt).toLocaleDateString('en', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                  </Text>
                </Stack> */}
                <Stack>
                  <Text variant="label1">Source</Text>
                  <Text as="a" href={imageUrl} target="_blank" variant="heading3" style={{ wordBreak: 'break-all' }}>
                    <u>{imageUrl}</u>
                  </Text>
                </Stack>
              </Stack>
              {isSameAddress(nft.owner, selectedAccount?.address) && (
                <div>
                  <Button
                    onClick={() => setTransferOpen(true)}
                    icon={<IconArrowLeft size={16} style={{ transform: 'scaleX(-1' }} />}
                    variant="outlined"
                  >
                    Transfer
                  </Button>
                  <TransferDialog
                    collectionId={collectionId}
                    nftId={nftId}
                    open={transferOpen}
                    onClose={() => setTransferOpen(false)}
                  />
                </div>
              )}
            </>
          )}
        </Shelf>
      }
    />
  )
}
