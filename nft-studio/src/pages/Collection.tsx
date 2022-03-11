import { Box, Grid, IconArrowLeft, IconPlus, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useRouteMatch } from 'react-router'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { Identity } from '../components/Identity'
import { NFTCard } from '../components/NFTCard'
import { PageHeader } from '../components/PageHeader'
import { AnchorPillButton } from '../components/PillButton'
import { RouterLinkButton } from '../components/RouterLinkButton'
import { PageWithSideBar } from '../components/shared/PageWithSideBar'
import { VisibilityChecker } from '../components/VisibilityChecker'
import { useWeb3 } from '../components/Web3Provider'
import { collectionMetadataSchema } from '../schemas'
import { useCollection } from '../utils/useCollections'
import { useMetadata } from '../utils/useMetadata'
import { useNFTs } from '../utils/useNFTs'
import { isSameAddress } from '../utils/web3'

export const CollectionPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <Collection />
    </PageWithSideBar>
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
  const centrifuge = useCentrifuge()

  const isLoanCollection = collection?.admin ? centrifuge.utils.isLoanPalletAccount(collection.admin) : true
  const canMint = !isLoanCollection && isSameAddress(selectedAccount?.address, collection?.owner)

  return (
    <Stack flex={1}>
      <PageHeader
        parent={{ to: '/nfts', label: 'NFTs' }}
        title={metadata?.name || 'Unnamed collection'}
        subtitle={
          collection?.owner && (
            <>
              by <Identity address={collection.owner} clickToCopy />
            </>
          )
        }
        actions={
          canMint && (
            <RouterLinkButton to={`/collection/${collectionId}/object/mint`} variant="outlined" icon={IconPlus} small>
              Mint NFT
            </RouterLinkButton>
          )
        }
      />
      <Box mt={1}>
        <RouterLinkButton icon={IconArrowLeft} to="/nfts" variant="text">
          Back
        </RouterLinkButton>
      </Box>
      <Stack alignItems="center" gap={2} mb={5} mt="-16px">
        <Stack alignItems="center" gap="4px">
          <Text variant="heading1" fontSize="36px" textAlign="center" style={{ wordBreak: 'break-word' }}>
            {metadata?.name || ''}
          </Text>
          <Shelf gap={1} alignItems="baseline">
            <Text variant="body2">by</Text>
            <AnchorPillButton
              href={`${process.env.REACT_APP_SUBSCAN_URL}/account/${collection?.owner ?? ''}`}
              target="_blank"
            >
              {collection?.owner && <Identity address={collection.owner} clickToCopy />}
            </AnchorPillButton>
          </Shelf>
        </Stack>

        {metadata?.description && (
          <Box maxWidth="680px">
            <Text
              variant="body1"
              textAlign="center"
              style={{
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 10,
                WebkitBoxOrient: 'vertical',
                wordBreak: 'break-word',
              }}
            >
              {metadata?.description || ''}
            </Text>
          </Box>
        )}
      </Stack>
      <Box mb={2}>
        <Text variant="heading3">{collection?.instances ?? 0} NFTs</Text>
      </Box>
      {nfts?.length ? (
        <>
          <Grid gap={[2, 3]} columns={[2, 2, 3, 4]} equalColumns>
            {nfts.slice(0, shownCount).map((nft) => (
              <NFTCard nft={nft} key={nft.id} />
            ))}
          </Grid>
          {nfts.length > shownCount && (
            <VisibilityChecker marginTop={400} onEnter={() => setShownCount((count) => count + COUNT_PER_PAGE)} />
          )}
        </>
      ) : (
        <Stack alignItems="flex-start">
          <Text variant="label1">This collection does not contain any NFT</Text>
          {canMint && (
            <RouterLinkButton to={`/collection/${collectionId}/object/mint`} variant="text" icon={IconPlus}>
              Mint NFT
            </RouterLinkButton>
          )}
        </Stack>
      )}
    </Stack>
  )
}
