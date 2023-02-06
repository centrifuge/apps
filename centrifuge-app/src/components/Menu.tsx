import { Pool } from '@centrifuge/centrifuge-js'
import {
  Box,
  IconInvestments,
  IconNft,
  IconUser,
  Menu as Panel,
  MenuItemGroup,
  Shelf,
  TextWithPlaceholder,
} from '@centrifuge/fabric'
import * as React from 'react'
import { useLocation } from 'react-router'
import { config } from '../config'
import { useAddress } from '../utils/useAddress'
import { useIsAboveBreakpoint } from '../utils/useIsAboveBreakpoint'
import { usePermissions } from '../utils/usePermissions'
import { usePoolMetadata, usePools } from '../utils/usePools'
import { Collapsible, NavigationItem } from './NavigationItem'
import { RouterLinkButton } from './RouterLinkButton'

type Props = {}

export const Menu: React.FC<Props> = () => {
  const { pathname } = useLocation()

  const allPools = usePools(false)
  const address = useAddress()
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
      <NavigationItem
        label="Investments"
        href="/investments"
        icon={<IconInvestments />}
        active={pathname.includes('investments')}
        stacked={!isXLarge}
      />

      <NavigationItem label="NFTs" href="/nfts" icon={<IconNft />} stacked={!isXLarge} />

      {(pools.length > 0 || config.poolCreationType === 'immediate') && (
        <Collapsible label="Issuer" icon={<IconUser />} defaultOpen={isXLarge} stacked={!isXLarge}>
          <Box as={isXLarge ? 'ul' : Panel}>
            {!!pools.length &&
              pools.map((pool) => (
                <Box as={isXLarge ? 'li' : MenuItemGroup} key={pool.id}>
                  <PoolNavigationItem pool={pool} />
                </Box>
              ))}

            {address && config.poolCreationType === 'immediate' && (
              <Shelf justifyContent="center" py={1}>
                <RouterLinkButton to="/issuer/create-pool" variant="secondary" small>
                  Create pool
                </RouterLinkButton>
              </Shelf>
            )}
          </Box>
        </Collapsible>
      )}
    </Shelf>
  )
}

const PoolNavigationItem: React.FC<{ pool: Pool }> = ({ pool }) => {
  const { data: metadata, isLoading } = usePoolMetadata(pool)

  return (
    <NavigationItem
      label={<TextWithPlaceholder isLoading={isLoading}>{metadata?.pool?.name ?? pool.id}</TextWithPlaceholder>}
      href={`/issuer/${pool.id}`}
    />
  )
}
