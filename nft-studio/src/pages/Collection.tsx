import { Grid, IconPlus, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useRouteMatch } from 'react-router'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { Identity } from '../components/Identity'
import { NFTCard } from '../components/NFTCard'
import { PageHeader } from '../components/PageHeader'
import { RouterLinkButton } from '../components/RouterLinkButton'
import { PageWithSideBar } from '../components/shared/PageWithSideBar'
import { VisibilityChecker } from '../components/VisibilityChecker'
import { collectionMetadataSchema } from '../schemas'
import { useAddress } from '../utils/useAddress'
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
  const address = useAddress()
  const collection = useCollection(collectionId)
  const { data: metadata } = useMetadata(collection?.metadataUri, collectionMetadataSchema)
  const nfts = useNFTs(collectionId)
  const [shownCount, setShownCount] = React.useState(COUNT_PER_PAGE)
  const centrifuge = useCentrifuge()

  const isLoanCollection = collection?.admin ? centrifuge.utils.isLoanPalletAccount(collection.admin) : true
  const canMint = !isLoanCollection && isSameAddress(address, collection?.owner)

  return (
    <Stack gap={8} flex={1}>
      <PageHeader
        parent={{ to: '/nfts', label: 'NFTs' }}
        title={metadata?.name || 'Unnamed collection'}
        subtitle={
          collection?.owner && (
            <>
              by <Identity address={collection?.owner} clickToCopy />
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
      {nfts?.length ? (
        <>
          <Grid gap={[2, 3]} columns={[2, 3, 4, 5]} equalColumns>
            {nfts.slice(0, shownCount).map((nft, i) => (
              <NFTCard nft={nft} key={i} />
            ))}
          </Grid>
          {nfts.length > shownCount && (
            <VisibilityChecker marginTop={400} onEnter={() => setShownCount((count) => count + COUNT_PER_PAGE)} />
          )}
        </>
      ) : (
        <Shelf justifyContent="center" mt="15vh" textAlign="center">
          <Text variant="heading2" color="textSecondary">
            The collection does not contain any NFTs yet
          </Text>
        </Shelf>
      )}
    </Stack>
  )
}
