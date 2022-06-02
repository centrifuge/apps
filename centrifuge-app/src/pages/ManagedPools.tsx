import { IconPlus, Shelf, Stack, Text } from '@centrifuge/fabric'
import React from 'react'
import { PageHeader } from '../components/PageHeader'
import { PageWithSideBar } from '../components/PageWithSideBar'
import { PoolList } from '../components/PoolList'
import { RouterLinkButton } from '../components/RouterLinkButton'
import { useAddress } from '../utils/useAddress'
import { usePermissions } from '../utils/usePermissions'
import { usePools } from '../utils/usePools'

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
  const permissions = usePermissions(address)

  const pools = React.useMemo(() => {
    if (!allPools || !permissions) {
      return []
    }
    return allPools.filter(({ id }) => permissions.pools[id]?.roles.includes('PoolAdmin'))
  }, [allPools, permissions])

  return (
    <Stack gap={8} flex={1}>
      <PageHeader
        title="Managed pools"
        actions={
          <RouterLinkButton variant="tertiary" to="/pool/new" icon={<IconPlus size="iconSmall" />}>
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
