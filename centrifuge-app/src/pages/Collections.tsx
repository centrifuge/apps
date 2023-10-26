import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Button, IconPlus, LayoutGrid, LayoutGridItem, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { CollectionCard, CollectionCardInner } from '../components/CollectionCard'
import { CreateCollectionDialog } from '../components/Dialogs/CreateCollectionDialog'
import { Identity } from '../components/Identity'
import { PageHeader } from '../components/PageHeader'
import { PageSection } from '../components/PageSection'
import { PageWithSideBar } from '../components/PageWithSideBar'
import { VisibilityChecker } from '../components/VisibilityChecker'
import { nftMetadataSchema } from '../schemas'
import { useAddress } from '../utils/useAddress'
import { useCollections, useFeaturedCollections } from '../utils/useCollections'
import { useMetadata } from '../utils/useMetadata'
import { useAccountNfts } from '../utils/useNFTs'
import { isSameAddress, isWhitelistedAccount } from '../utils/web3'

export default function CollectionsPage() {
  return (
    <PageWithSideBar>
      <Collections />
    </PageWithSideBar>
  )
}

const COUNT_PER_PAGE = 12

const Collections: React.FC = () => {
  const [createOpen, setCreateOpen] = React.useState(false)
  const address = useAddress('substrate')
  const collections = useCollections()
  const [shownCount, setShownCount] = React.useState(COUNT_PER_PAGE)
  const accountNfts = useAccountNfts(address, false)
  const { data: firstAccountNftMetadata } = useMetadata(accountNfts?.[0]?.metadataUri, nftMetadataSchema)
  const centrifuge = useCentrifuge()

  const featuredCollections = useFeaturedCollections()

  const userCollections = React.useMemo(
    () =>
      collections?.filter((c) => {
        if (centrifuge.utils.isLoanPalletAccount(c.admin)) return false
        return isSameAddress(c.owner, address)
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [collections, address]
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
    [collections, address]
  )

  return (
    <Stack>
      <PageHeader
        title="NFTs"
        actions={
          <Button onClick={() => setCreateOpen(true)} variant="secondary" small icon={IconPlus} disabled={!address}>
            Create Collection
          </Button>
        }
      />
      {featuredCollections?.length ? (
        <PageSection title="Featured collections">
          <LayoutGrid>
            {featuredCollections?.map((col) => (
              <LayoutGridItem span={[4, 2, 4, 3]} key={col.id}>
                <CollectionCard collection={col} />
              </LayoutGridItem>
            ))}
          </LayoutGrid>
        </PageSection>
      ) : null}

      {address && (
        <PageSection title="My collections">
          {userCollections?.length || accountNfts?.length ? (
            <LayoutGrid>
              {accountNfts?.length ? (
                <LayoutGridItem span={[4, 2, 4, 3]}>
                  <CollectionCardInner
                    title="All my NFTs"
                    label={
                      <>
                        by <Identity address={address} />
                      </>
                    }
                    description="A dynamic collection of owned NFTs"
                    to="/nfts/account"
                    image={firstAccountNftMetadata?.image}
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
            <Text variant="heading2" color="textSecondary">
              You have no collections yet
            </Text>
          )}
        </PageSection>
      )}

      <PageSection title={address || featuredCollections?.length ? 'Other collections' : 'Collections'}>
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
          <Text variant="heading2" color="textSecondary">
            There are no collections yet
          </Text>
        )}
      </PageSection>

      <CreateCollectionDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </Stack>
  )
}
