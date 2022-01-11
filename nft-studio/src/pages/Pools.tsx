import { AnchorButton, IconPlus, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { PageHeader } from '../components/PageHeader'
import { PoolList } from '../components/PoolList'
import { PageWithSideBar } from '../components/shared/PageWithSideBar'
import { usePools } from '../utils/usePools'

export const PoolsPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <Pools />
    </PageWithSideBar>
  )
}

const Pools: React.FC = () => {
  const { data: pools } = usePools()
  console.log('pools', pools)

  return (
    <Stack gap={8} flex={1}>
      <PageHeader
        title="Pools"
        actions={
          <AnchorButton variant="text" href="/pool/new" icon={<IconPlus size="iconSmall" />}>
            <Text variant="interactive1" color="currentColor">
              Create pool
            </Text>
          </AnchorButton>
        }
      />
      {pools?.length ? (
        <PoolList pools={pools} />
      ) : (
        <Shelf justifyContent="center" textAlign="center">
          <Text variant="heading2" color="textSecondary">
            There are no pools yet
          </Text>
        </Shelf>
      )}
    </Stack>
  )
}
