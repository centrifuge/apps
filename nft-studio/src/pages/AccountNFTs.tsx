import { Button, Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { NFTCard } from '../components/NFTCard'
import { PageHeader } from '../components/PageHeader'
import { PageWithSideBar } from '../components/shared/PageWithSideBar'
import { VisibilityChecker } from '../components/VisibilityChecker'
import { useWeb3 } from '../components/Web3Provider'
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
  const { selectedAccount, isConnecting, connect } = useWeb3()
  const nfts = useAccountNfts(selectedAccount?.address)
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

  if (!selectedAccount) {
    return (
      <Shelf justifyContent="center">
        <Button onClick={() => connect()} loading={isConnecting}>
          Connect
        </Button>
      </Shelf>
    )
  }

  return (
    <Stack gap={8} flex={1} pb={8}>
      <PageHeader parent={{ to: '/nfts', label: 'collections' }} title="My NFTs" />
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
    </Stack>
  )
}
