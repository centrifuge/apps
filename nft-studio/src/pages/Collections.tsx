import { Button, IconPlus, LayoutGrid, LayoutGridItem, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { CollectionCard } from '../components/CollectionCard'
import { CreateCollectionDialog } from '../components/CreateCollectionDialog'
import { Footer } from '../components/Footer'
import { PageContainer } from '../components/PageContainer'
import { useWeb3 } from '../components/Web3Provider'
import { useCollections } from '../utils/useCollections'
import { isSameAddress } from '../utils/web3'

export const CollectionsPage: React.FC = () => {
  return (
    <PageContainer>
      <Collections />
    </PageContainer>
  )
}

const Collections: React.FC = () => {
  const [createOpen, setCreateOpen] = React.useState(false)
  const { selectedAccount } = useWeb3()
  const { data: collections } = useCollections()

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
          {userCollections?.length ? (
            <LayoutGrid>
              {userCollections?.map((col) => (
                <LayoutGridItem span={4} key={col.id}>
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
        <Text variant="heading2" as="h2">
          {selectedAccount ? 'Other Collections' : 'Collections'}
        </Text>
        {otherCollections?.length ? (
          <LayoutGrid>
            {otherCollections?.map((col) => (
              <LayoutGridItem span={4} key={col.id}>
                <CollectionCard collection={col} />
              </LayoutGridItem>
            ))}
          </LayoutGrid>
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
