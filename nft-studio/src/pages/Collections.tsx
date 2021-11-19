import { Button, IconPlus, LayoutGrid, LayoutGridItem, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { CollectionCard, CollectionCardInner } from '../components/CollectionCard'
import { CreateCollectionDialog } from '../components/CreateCollectionDialog'
import { Footer } from '../components/Footer'
import { PageContainer } from '../components/PageContainer'
import { VisibilityChecker } from '../components/VisibilityChecker'
import { useWeb3 } from '../components/Web3Provider'
import { useCollections } from '../utils/useCollections'
import { useAccountNfts } from '../utils/useNFTs'
import { isSameAddress } from '../utils/web3'

export const CollectionsPage: React.FC = () => {
  return (
    <PageContainer>
      <Collections />
    </PageContainer>
  )
}

const COUNT_PER_PAGE = 12

const Collections: React.FC = () => {
  const [createOpen, setCreateOpen] = React.useState(false)
  const { selectedAccount } = useWeb3()
  const { data: collections } = useCollections()
  const [shownCount, setShownCount] = React.useState(COUNT_PER_PAGE)
  const { data: accountNfts } = useAccountNfts(selectedAccount?.address, false)

  const userCollections = React.useMemo(
    () => collections?.filter((c) => isSameAddress(c.owner, selectedAccount?.address)),
    [collections, selectedAccount?.address]
  )

  const otherCollections = React.useMemo(
    () => collections?.filter((c) => !isSameAddress(c.owner, selectedAccount?.address)),
    [collections, selectedAccount?.address]
  )

  return (
    <Stack gap={8} flex={1}>
      {selectedAccount && (
        <Stack gap={3}>
          <Shelf justifyContent="space-between">
            <Text variant="heading2" as="h2">
              My Collections
            </Text>
            <Button onClick={() => setCreateOpen(true)} variant="text" icon={IconPlus}>
              Create Collection
            </Button>
          </Shelf>
          {userCollections?.length || accountNfts?.length ? (
            <LayoutGrid>
              {userCollections?.map((col) => (
                <LayoutGridItem span={4} key={col.id}>
                  <CollectionCard collection={col} />
                </LayoutGridItem>
              ))}
              {accountNfts?.length && (
                <LayoutGridItem span={4}>
                  <CollectionCardInner title="My owned NFTs" to="/account" previewNFTs={accountNfts} />
                </LayoutGridItem>
              )}
            </LayoutGrid>
          ) : (
            <Shelf justifyContent="center" textAlign="center">
              <Text variant="heading2" color="textSecondary">
                You have no collections yet
              </Text>
            </Shelf>
          )}
        </Stack>
      )}
      <Stack gap={3}>
        <Text variant="heading2" as="h2">
          {selectedAccount ? 'Other Collections' : 'Collections'}
        </Text>
        {otherCollections?.length ? (
          <>
            <LayoutGrid>
              {otherCollections.slice(0, shownCount).map((col) => (
                <LayoutGridItem span={4} key={col.id}>
                  <CollectionCard collection={col} />
                </LayoutGridItem>
              ))}
            </LayoutGrid>
            {otherCollections.length > shownCount && (
              <VisibilityChecker marginTop={400} onEnter={() => setShownCount((count) => count + COUNT_PER_PAGE)} />
            )}
          </>
        ) : (
          <Shelf justifyContent="center" textAlign="center">
            <Text variant="heading2" color="textSecondary">
              There are no collections yet
            </Text>
          </Shelf>
        )}
      </Stack>
      <CreateCollectionDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <Footer />
    </Stack>
  )
}
