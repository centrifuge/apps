import { Pool } from '@centrifuge/centrifuge-js'
import { Box, IconInvestments, IconNft, IconPieChart, IconPools, IconUser, Shelf } from '@centrifuge/fabric'
import React from 'react'
import { useRouteMatch } from 'react-router'
import { Link } from 'react-router-dom'
import { config } from '../config'
import { useAddress } from '../utils/useAddress'
import { usePermissions } from '../utils/usePermissions'
import { usePoolMetadata, usePools } from '../utils/usePools'
import { NavigationItem } from './NavigationItem'
import { RouterLinkButton } from './RouterLinkButton'
import { TextWithPlaceholder } from './TextWithPlaceholder'

type Props = {}

export const Menu: React.FC<Props> = () => {
  const homeMatch = useRouteMatch({ path: '/', exact: true })

  const allPools = usePools()
  const address = useAddress()
  const permissions = usePermissions(address)

  const pools = React.useMemo(() => {
    if (!allPools || !permissions) {
      return []
    }
    return allPools.filter(({ id }) => permissions.pools[id]?.roles.includes('PoolAdmin'))
  }, [allPools, permissions])

  const Logo = config.logo

  return (
    <Box position="sticky" top={0} px={[0, 0, 2]}>
      <Link to="/">
        <Box py={[0, 0, 3]} px={1} mb={2} color="textPrimary">
          <Logo style={{ maxHeight: '56px', maxWidth: '50%' }} />
        </Box>
      </Link>
      <Shelf
        gap={1}
        flexDirection={['row', 'row', 'column']}
        alignItems={['center', 'center', 'stretch']}
        justifyContent="space-evenly"
        px={[2, 2, 0]}
      >
        <NavigationItem label="Tokens" href="/tokens" icon={<IconInvestments size="16px" />} active={!!homeMatch} />
        <NavigationItem label="Pools" href="/pools" icon={<IconPools size="16px" />} />
        <NavigationItem label="NFTs" href="/nfts" icon={<IconNft size="16px" />} />
        <NavigationItem label="Portfolio" href="/investments/portfolio" icon={<IconPieChart size="16px" />} />
        {pools.length > 0 && (
          <NavigationItem label="Issuer" href="issuer" icon={<IconUser size="16px" />} defaultOpen>
            {pools.map((pool) => (
              <PoolNavigationItem key={pool.id} pool={pool} />
            ))}
            {address && (
              <Shelf justifyContent="center" mt={1}>
                <RouterLinkButton to="/issuer/create-pool" variant="secondary" small>
                  Create Pool
                </RouterLinkButton>
              </Shelf>
            )}
          </NavigationItem>
        )}
      </Shelf>
    </Box>
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
