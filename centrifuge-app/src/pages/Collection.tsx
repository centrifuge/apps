import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Box, Grid, Shelf, Stack, Text, TextWithPlaceholder } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { Identity } from '../components/Identity'
import { LogoAltair } from '../components/LogoAltair'
import { NFTCard } from '../components/NFTCard'
import { PageHeader } from '../components/PageHeader'
import { PageSection } from '../components/PageSection'
import { AnchorPillButton } from '../components/PillButton'
import { RouterLinkButton } from '../components/RouterLinkButton'
import { VisibilityChecker } from '../components/VisibilityChecker'
import { collectionMetadataSchema } from '../schemas'
import { useCollection } from '../utils/useCollections'
import { useMetadata } from '../utils/useMetadata'
import { useNFTs } from '../utils/useNFTs'
import { useSuitableAccounts } from '../utils/usePermissions'

interface Params extends Record<string, string | undefined> {
  cid: string
}

export default function CollectionPage() {
  return <Collection />
}

const COUNT_PER_PAGE = 16

function Collection() {
  const { cid: collectionId } = useParams<Params>()
  const collection = useCollection(collectionId)

  if (!collection) throw new Error('Collection not found')

  const nfts = useNFTs(collectionId)
  const { data: metadata, isLoading } = useMetadata(collection?.metadataUri, collectionMetadataSchema)
  const [shownCount, setShownCount] = React.useState(COUNT_PER_PAGE)
  const centrifuge = useCentrifuge()
  const [account] = useSuitableAccounts({ actingAddress: [collection.owner] })

  const canMint = !!account

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
      />
      <Stack alignItems="center" gap={2} my={5}>
        {metadata?.image ? (
          <Box
            as="img"
            alt=""
            src={centrifuge.metadata.parseMetadataUrl(metadata.image)}
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
              href={`${import.meta.env.REACT_APP_SUBSCAN_URL}/account/${collection?.owner ?? ''}`}
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
          <PageSection
            title={`${collection?.items ?? 0} NFTs`}
            headerRight={
              canMint && (
                <RouterLinkButton to={`/nfts/collection/${collectionId}/object/mint`} variant="secondary" small>
                  Mint NFT
                </RouterLinkButton>
              )
            }
          >
            <Grid gap={[2, 3]} columns={[1, 2, 2, 3, 4]} equalColumns>
              {nfts.slice(0, shownCount).map((nft) => (
                <NFTCard nft={nft} key={nft.id} />
              ))}
            </Grid>
          </PageSection>
          {nfts.length > shownCount && (
            <VisibilityChecker marginTop={400} onEnter={() => setShownCount((count) => count + COUNT_PER_PAGE)} />
          )}
        </>
      ) : (
        <Stack alignItems="center" gap={2} mt={8}>
          <Text variant="label1">This collection does not contain any NFT</Text>
          {canMint && <RouterLinkButton to={`/nfts/collection/${collectionId}/object/mint`}>Mint NFT</RouterLinkButton>}
        </Stack>
      )}
    </Stack>
  )
}
