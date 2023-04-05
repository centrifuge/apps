import { Box, IconInvestments, IconNft, Menu as Panel, MenuItemGroup, Shelf, Stack } from '@centrifuge/fabric'
import * as React from 'react'
import { config } from '../../config'
import { useAddress } from '../../utils/useAddress'
import { useIsAboveBreakpoint } from '../../utils/useIsAboveBreakpoint'
import { usePermissions } from '../../utils/usePermissions'
import { usePools } from '../../utils/usePools'
import { RouterLinkButton } from '../RouterLinkButton'
import { IssuerMenu } from './IssuerMenu'
import { PageLink } from './PageLink'
import { PoolLink } from './PoolLink'

export function Menu() {
  const allPools = usePools(false)
  const address = useAddress('substrate')
  const permissions = usePermissions(address)
  const isXLarge = useIsAboveBreakpoint('XL')

  const pools = React.useMemo(() => {
    if (!allPools || !permissions) {
      return []
    }

    return allPools.filter(
      ({ id }) =>
        permissions.pools[id]?.roles.includes('PoolAdmin') || permissions.pools[id]?.roles.includes('MemberListAdmin')
    )
  }, [allPools, permissions])

  return (
    <Shelf
      width="100%"
      position="relative"
      gap={1}
      flexDirection={['row', 'row', 'column']}
      alignItems={['center', 'center', 'stretch']}
    >
      <PageLink to="/pools" stacked={!isXLarge}>
        <IconInvestments />
        Pools
      </PageLink>

      {config.network !== 'centrifuge' && (
        <PageLink to="/nfts" stacked={!isXLarge}>
          <IconNft />
          NFTs
        </PageLink>
      )}

      {(pools.length > 0 || config.poolCreationType === 'immediate') && (
        <IssuerMenu defaultOpen={isXLarge} stacked={!isXLarge} poolIds={pools.map(({ id }) => id)}>
          {isXLarge ? (
            <Stack as="ul" gap={1}>
              {!!pools.length &&
                pools.map((pool) => (
                  <Box key={pool.id} as="li" pl={4}>
                    <PoolLink pool={pool} />
                  </Box>
                ))}
              {address && config.poolCreationType === 'immediate' && (
                <Shelf justifyContent="center" as="li" mt={1}>
                  <CreatePool />
                </Shelf>
              )}
            </Stack>
          ) : (
            <Panel>
              {!!pools.length &&
                pools.map((pool) => (
                  <MenuItemGroup key={pool.id}>
                    <Box px={2} py={1}>
                      <PoolLink pool={pool} />
                    </Box>
                  </MenuItemGroup>
                ))}
              {address && config.poolCreationType === 'immediate' && (
                <Box px={2} py={1}>
                  <CreatePool />
                </Box>
              )}
            </Panel>
          )}
        </IssuerMenu>
      )}
    </Shelf>
  )
}

function CreatePool() {
  return (
    <RouterLinkButton to="/issuer/create-pool" variant="secondary" small>
      Create pool
    </RouterLinkButton>
  )
}
