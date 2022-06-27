import { Box, Grid, IconArrowLeft, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useRouteMatch } from 'react-router'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { useDebugFlags } from '../components/DebugFlags'
import { Identity } from '../components/Identity'
import { LogoAltair } from '../components/LogoAltair'
import { NFTCard } from '../components/NFTCard'
import { PageHeader } from '../components/PageHeader'
import { AnchorPillButton } from '../components/PillButton'
import { RouterLinkButton } from '../components/RouterLinkButton'
import { PageWithSideBar } from '../components/shared/PageWithSideBar'
import { TextWithPlaceholder } from '../components/TextWithPlaceholder'
import { VisibilityChecker } from '../components/VisibilityChecker'
import { useWeb3 } from '../components/Web3Provider'
import { collectionMetadataSchema } from '../schemas'
import { parseMetadataUrl } from '../utils/parseMetadataUrl'
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
  const { data: metadata, isLoading } = useMetadata(collection?.metadataUri, collectionMetadataSchema)
  const { data: nfts } = useNFTs(collectionId)
  const [shownCount, setShownCount] = React.useState(COUNT_PER_PAGE)
  const centrifuge = useCentrifuge()
  const { showOnlyNFT } = useDebugFlags()

  const isLoanCollection = collection?.admin ? centrifuge.utils.isLoanPalletAccount(collection.admin) : true
  const canMint = !isLoanCollection && isSameAddress(selectedAccount?.address, collection?.owner)

  return (
    <Stack flex={1} pb={8}>
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
            <RouterLinkButton to={`/collection/${collectionId}/object/mint`} variant="outlined" small>
              Mint NFT
            </RouterLinkButton>
          )
        }
      />
      <Box mt={1}>
        <RouterLinkButton icon={IconArrowLeft} to="/nfts" variant="text">
          {showOnlyNFT ? 'Home' : 'Back'}
        </RouterLinkButton>
      </Box>
      <Stack alignItems="center" gap={2} mb={5} mt="-16px">
        {metadata?.image ? (
          <Box
            as="img"
            alt=""
            src={parseMetadataUrl(metadata.image)}
            display="block"
            width="144px"
            height="144px"
            borderRadius="50%"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <Shelf
            backgroundColor="black"
            display="flex"
            width="144px"
            height="144px"
            justifyContent="center"
            borderRadius="50%"
            borderWidth={1}
            borderStyle="solid"
            borderColor="borderPrimary"
          >
            <LogoAltair width="100px" />
          </Shelf>
        )}
        <Stack alignItems="center" gap="4px">
          <TextWithPlaceholder
            isLoading={isLoading}
            variant="heading1"
            fontSize="36px"
            textAlign="center"
            style={{ wordBreak: 'break-word' }}
          >
            {metadata?.name || 'Unnamed collection'}
          </TextWithPlaceholder>
          <Shelf gap={1} alignItems="baseline" flexWrap="wrap">
            <Box mx="auto">
              <Text variant="body2">by</Text>
            </Box>
            <AnchorPillButton
              href={`${process.env.REACT_APP_SUBSCAN_URL}/account/${collection?.owner ?? ''}`}
              target="_blank"
            >
              {collection?.owner && <Identity address={collection.owner} clickToCopy />}
            </AnchorPillButton>
          </Shelf>
        </Stack>

        <Box maxWidth="680px">
          <TextWithPlaceholder
            isLoading={isLoading}
            width={100}
            words={1}
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
          </TextWithPlaceholder>
        </Box>
      </Stack>
      {nfts?.length ? (
        <>
          <Box mb={2}>
            <Text variant="heading3">{collection?.items ?? 0} NFTs</Text>
          </Box>
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
        <Stack alignItems="center" gap={2} mt={8}>
          <Text variant="label1">This collection does not contain any NFT</Text>
          {canMint && <RouterLinkButton to={`/collection/${collectionId}/object/mint`}>Mint NFT</RouterLinkButton>}
        </Stack>
      )}
    </Stack>
  )
}
