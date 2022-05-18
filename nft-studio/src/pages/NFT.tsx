import { Box, Button, IconArrowRight, IconNft, IconPlus, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router-dom'
import { BuyDialog } from '../components/BuyDialog'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { RemoveListingDialog } from '../components/Dialogs/RemoveListingDialog'
import { SellDialog } from '../components/Dialogs/SellDialog'
import { TransferDialog } from '../components/Dialogs/TransferDialog'
import { Identity } from '../components/Identity'
import { PageHeader } from '../components/PageHeader'
import { PageSection } from '../components/PageSection'
import { PageWithSideBar } from '../components/PageWithSideBar'
import { AnchorPillButton } from '../components/PillButton'
import { RouterLinkButton } from '../components/RouterLinkButton'
import { TextWithPlaceholder } from '../components/TextWithPlaceholder'
import { nftMetadataSchema } from '../schemas'
import { parseMetadataUrl } from '../utils/parseMetadataUrl'
import { useAddress } from '../utils/useAddress'
import { useCollection, useCollectionMetadata } from '../utils/useCollections'
import { useMetadata } from '../utils/useMetadata'
import { useNFT } from '../utils/useNFTs'
import { usePermissions } from '../utils/usePermissions'
import { isSameAddress } from '../utils/web3'

export const NFTPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <NFT />
    </PageWithSideBar>
  )
}

const NFT: React.FC = () => {
  const { cid: collectionId, nftid: nftId } = useParams<{ cid: string; nftid: string }>()
  const address = useAddress()
  const permissions = usePermissions(address)
  const nft = useNFT(collectionId, nftId)
  const { data: nftMetadata, isLoading } = useMetadata(nft?.metadataUri, nftMetadataSchema)
  const collection = useCollection(collectionId)
  const { data: collectionMetadata } = useCollectionMetadata(collection?.id)
  const [transferOpen, setTransferOpen] = React.useState(false)
  const [sellOpen, setSellOpen] = React.useState(false)
  const [buyOpen, setBuyOpen] = React.useState(false)
  const [unlistOpen, setUnlistOpen] = React.useState(false)
  const centrifuge = useCentrifuge()

  const imageUrl = nftMetadata?.image ? parseMetadataUrl(nftMetadata.image) : ''

  const isLoanCollection = collection?.admin ? centrifuge.utils.isLoanPalletAccount(collection.admin) : true
  const canCreateLoan =
    !isLoanCollection && permissions && Object.values(permissions.pools).some((p) => p.roles.includes('Borrower'))

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
          actions={
            <>
              {nft &&
                address &&
                (isSameAddress(nft.owner, address) ? (
                  <>
                    {canCreateLoan && (
                      <RouterLinkButton
                        to={`/nfts/collection/${collectionId}/object/${nftId}/new-asset`}
                        icon={IconPlus}
                        small
                        variant="secondary"
                      >
                        Create asset
                      </RouterLinkButton>
                    )}
                    {nft.sellPrice !== null ? (
                      <Button onClick={() => setUnlistOpen(true)} small variant="secondary">
                        Remove listing
                      </Button>
                    ) : (
                      <Button onClick={() => setSellOpen(true)} small variant="secondary">
                        Sell
                      </Button>
                    )}
                    <Button
                      onClick={() => setTransferOpen(true)}
                      icon={IconArrowRight}
                      small
                      variant="secondary"
                      disabled={nft.sellPrice !== null}
                    >
                      Transfer
                    </Button>
                    <TransferDialog
                      collectionId={collectionId}
                      nftId={nftId}
                      open={transferOpen}
                      onClose={() => setTransferOpen(false)}
                    />
                    <SellDialog
                      collectionId={collectionId}
                      nftId={nftId}
                      open={sellOpen}
                      onClose={() => setSellOpen(false)}
                    />
                    <BuyDialog
                      collectionId={collectionId}
                      nftId={nftId}
                      open={buyOpen}
                      onClose={() => setBuyOpen(false)}
                    />
                    <RemoveListingDialog
                      collectionId={collectionId}
                      nftId={nftId}
                      open={unlistOpen}
                      onClose={() => setUnlistOpen(false)}
                    />
                  </>
                ) : (
                  <>
                    {nft.sellPrice !== null && (
                      <Button onClick={() => setBuyOpen(true)} small>
                        Buy
                      </Button>
                    )}
                    <BuyDialog
                      collectionId={collectionId}
                      nftId={nftId}
                      open={buyOpen}
                      onClose={() => setBuyOpen(false)}
                    />
                  </>
                ))}
            </>
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
                bg="borderSecondary"
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

                {nft.sellPrice !== null && (
                  <Stack gap={1}>
                    <Text variant="label1">Price</Text>
                    <Text variant="heading3">{centrifuge.utils.formatCurrencyAmount(nft.sellPrice, 'AIR')}</Text>
                  </Stack>
                )}
              </>
            )}
          </Stack>
        </Shelf>
      </PageSection>
    </Stack>
  )
}
