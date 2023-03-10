import { useCentrifuge, WalletMenu } from '@centrifuge/centrifuge-react'
import { Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { NFTCard } from '../components/NFTCard'
import { PageHeader } from '../components/PageHeader'
import { PageSection } from '../components/PageSection'
import { PageWithSideBar } from '../components/PageWithSideBar'
import { VisibilityChecker } from '../components/VisibilityChecker'
import { useAddress } from '../utils/useAddress'
import { useCollections } from '../utils/useCollections'
import { useAccountNfts } from '../utils/useNFTs'

export const AccountNFTsPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <AccountNFTs />
    </PageWithSideBar>
  )
}

const COUNT_PER_PAGE = 16

const AccountNFTs: React.FC = () => {
  const address = useAddress('substrate')
  const nfts = useAccountNfts(address)
  const collections = useCollections()
  const [shownCount, setShownCount] = React.useState(COUNT_PER_PAGE)
  const centrifuge = useCentrifuge()

  const filteredNfts = React.useMemo(
    () =>
      nfts?.filter((nft) => {
        const collection = collections?.find((c) => c.id === nft.collectionId)
        if (!collection) return false

        return !centrifuge.utils.isLoanPalletAccount(collection.admin)
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nfts]
  )

  if (!address) {
    return (
      <Shelf justifyContent="center">
        <WalletMenu />
      </Shelf>
    )
  }

  return (
    <Stack>
      <PageHeader parent={{ to: '/nfts', label: 'Collections' }} title="My NFTs" />
      <PageSection>
        {filteredNfts?.length ? (
          <>
            <Grid gap={[2, 3]} columns={[2, 2, 3, 4]} equalColumns>
              {filteredNfts.slice(0, shownCount).map((nft) => (
                <NFTCard nft={nft} key={`${nft.collectionId}-${nft.id}`} />
              ))}
            </Grid>
            {filteredNfts.length > shownCount && (
              <VisibilityChecker marginTop={400} onEnter={() => setShownCount((count) => count + COUNT_PER_PAGE)} />
            )}
          </>
        ) : (
          <Shelf justifyContent="center" mt="15vh" textAlign="center">
            <Text variant="heading2" color="textSecondary">
              You don&rsquo;t own any NFTs yet
            </Text>
          </Shelf>
        )}
      </PageSection>
    </Stack>
  )
}
