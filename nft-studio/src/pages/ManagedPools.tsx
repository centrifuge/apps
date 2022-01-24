import { AnchorButton, IconPlus, Shelf, Stack, Text } from '@centrifuge/fabric'
import { encodeAddress } from '@polkadot/util-crypto'
import React, { useMemo } from 'react'
import { PageHeader } from '../components/PageHeader'
import { PoolList } from '../components/PoolList'
import { PageWithSideBar } from '../components/shared/PageWithSideBar'
import { useWeb3 } from '../components/Web3Provider'
import { usePools } from '../utils/usePools'

export const ManagedPoolsPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <ManagedPools />
    </PageWithSideBar>
  )
}

const ManagedPools: React.FC = () => {
  const { data: allPools } = usePools()
  const { selectedAccount } = useWeb3()

  const pools = useMemo(() => {
    if (!allPools || !selectedAccount?.address) {
      return []
    }
    return allPools.filter(({ owner }) => encodeAddress(owner, 2) === encodeAddress(selectedAccount.address, 2))
  }, [allPools, selectedAccount?.address])

  console.log('managed pools', pools)

  return (
    <Stack gap={8} flex={1}>
      <PageHeader
        title="Managed pools"
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
