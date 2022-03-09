import { Button, IconPlus, LayoutGrid, LayoutGridItem, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { CollectionCard, CollectionCardInner } from '../components/CollectionCard'
import { CreateCollectionDialog } from '../components/CreateCollectionDialog'
import { Identity } from '../components/Identity'
import { PageHeader } from '../components/PageHeader'
import { PageWithSideBar } from '../components/shared/PageWithSideBar'
import { VisibilityChecker } from '../components/VisibilityChecker'
import { useWeb3 } from '../components/Web3Provider'
import { useCollections, useFeaturedCollections } from '../utils/useCollections'
import { useAccountNfts } from '../utils/useNFTs'
import { isSameAddress, isWhitelistedAccount } from '../utils/web3'

export const CollectionsPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <Collections />
    </PageWithSideBar>
  )
}

const COUNT_PER_PAGE = 12

const Collections: React.FC = () => {
  const [createOpen, setCreateOpen] = React.useState(false)
  const { selectedAccount } = useWeb3()
  const { data: collections } = useCollections()
  const [shownCount, setShownCount] = React.useState(COUNT_PER_PAGE)
  const { data: accountNfts } = useAccountNfts(selectedAccount?.address, false)
  const centrifuge = useCentrifuge()

  const featuredCollections = useFeaturedCollections()

  const userCollections = React.useMemo(
    () =>
      collections?.filter((c) => {
        if (centrifuge.utils.isLoanPalletAccount(c.admin)) return false
        return isSameAddress(c.owner, selectedAccount?.address)
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [collections, selectedAccount?.address]
  )

  const otherCollections = React.useMemo(
    () => {
      const userCollectionIds = userCollections?.map((c) => c.id) || []
      const featuredCollectionIds = featuredCollections?.map((c) => c.id) || []

      const excludedCollectionIds = [...userCollectionIds, ...featuredCollectionIds]

      return collections?.filter((c) => {
        if (excludedCollectionIds.includes(c.id) || centrifuge.utils.isLoanPalletAccount(c.admin)) return false
        return isWhitelistedAccount(c.owner)
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [collections, selectedAccount?.address]
  )

  return (
    <Stack gap={8} flex={1} pb={8}>
      <PageHeader
        title="NFTs"
        actions={
          <Button
            onClick={() => setCreateOpen(true)}
            variant="text"
            small
            icon={IconPlus}
            disabled={!selectedAccount?.address}
          >
            Create Collection
          </Button>
        }
      />
      {featuredCollections?.length ? (
        <Stack gap={3}>
          <Text variant="heading3" as="h2">
            Featured collections
          </Text>

          <LayoutGrid>
            {featuredCollections?.map((col) => (
              <LayoutGridItem span={[4, 2, 4, 3]} key={col.id}>
                <CollectionCard collection={col} />
              </LayoutGridItem>
            ))}
          </LayoutGrid>
        </Stack>
      ) : null}
      {selectedAccount && (
        <Stack gap={3}>
          <Text variant="heading3" as="h2">
            My collections
          </Text>
          {userCollections?.length || accountNfts?.length ? (
            <LayoutGrid>
              {accountNfts?.length ? (
                <LayoutGridItem span={[4, 2, 4, 3]}>
                  <CollectionCardInner
                    title="All my NFTs"
                    label={
                      <>
                        by <Identity address={selectedAccount.address} />
                      </>
                    }
                    description="A dynamic collection of owned NFTs"
                    to="/account"
                    previewNFTs={accountNfts}
                    count={accountNfts.length}
                  />
                </LayoutGridItem>
              ) : null}
              {userCollections?.map((col) => (
                <LayoutGridItem span={[4, 2, 4, 3]} key={col.id}>
                  <CollectionCard collection={col} />
                </LayoutGridItem>
              ))}
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
        <Text variant="heading3" as="h2">
          {selectedAccount || featuredCollections?.length ? 'Other collections' : 'Collections'}
        </Text>
        {otherCollections?.length ? (
          <>
            <LayoutGrid>
              {otherCollections.slice(0, shownCount).map((col) => (
                <LayoutGridItem span={[4, 2, 4, 3]} key={col.id}>
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
    </Stack>
  )
}
