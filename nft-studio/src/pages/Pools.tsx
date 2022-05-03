import { Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { PageHeader } from '../components/PageHeader'
import { PageWithSideBar } from '../components/PageWithSideBar'
import { PoolList } from '../components/PoolList'
import { usePools } from '../utils/usePools'

export const PoolsPage: React.FC = () => {
  return (
    <PageWithSideBar sidebar>
      <Pools />
    </PageWithSideBar>
  )
}

const Pools: React.FC = () => {
  const pools = usePools()

  return (
    <Stack gap={8} flex={1}>
      <PageHeader title="Pools" />
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
