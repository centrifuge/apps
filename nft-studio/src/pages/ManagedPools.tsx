import { IconPlus, Shelf, Stack, Text } from '@centrifuge/fabric'
import React, { useMemo } from 'react'
import { PageHeader } from '../components/PageHeader'
import { PageWithSideBar } from '../components/PageWithSideBar'
import { PoolList } from '../components/PoolList'
import { RouterLinkButton } from '../components/RouterLinkButton'
import { useAddress } from '../utils/useAddress'
import { usePools } from '../utils/usePools'
import { isSameAddress } from '../utils/web3'

export const ManagedPoolsPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <ManagedPools />
    </PageWithSideBar>
  )
}

const ManagedPools: React.FC = () => {
  const allPools = usePools()
  const address = useAddress()

  const pools = useMemo(() => {
    if (!allPools || !address) {
      return []
    }
    return allPools.filter(({ owner }) => isSameAddress(owner, address))
  }, [allPools, address])

  return (
    <Stack gap={8} flex={1}>
      <PageHeader
        title="Managed pools"
        actions={
          <RouterLinkButton variant="text" to="/pool/new" icon={<IconPlus size="iconSmall" />}>
            <Text variant="interactive1" color="currentColor">
              Create pool
            </Text>
          </RouterLinkButton>
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
