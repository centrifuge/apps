import { Pool } from '@centrifuge/centrifuge-js'
import { Box, IconInvestments, IconNft, IconUser, Shelf, TextWithPlaceholder } from '@centrifuge/fabric'
import React from 'react'
import { useLocation } from 'react-router'
import { Link } from 'react-router-dom'
import { config } from '../config'
import { useAddress } from '../utils/useAddress'
import { useIsAboveBreakpoint } from '../utils/useIsAboveBreakpoint'
import { usePermissions } from '../utils/usePermissions'
import { usePoolMetadata, usePools } from '../utils/usePools'
import { NavigationItem } from './NavigationItem'
import { RouterLinkButton } from './RouterLinkButton'

type Props = {}

export const Menu: React.FC<Props> = () => {
  const { pathname } = useLocation()

  const allPools = usePools(false)
  const address = useAddress()
  const permissions = usePermissions(address)
  const isMedium = useIsAboveBreakpoint('M')
  const isLarge = useIsAboveBreakpoint('L')

  const pools = React.useMemo(() => {
    if (!allPools || !permissions) {
      return []
    }
    return allPools.filter(
      ({ id }) =>
        permissions.pools[id]?.roles.includes('PoolAdmin') || permissions.pools[id]?.roles.includes('MemberListAdmin')
    )
  }, [allPools, permissions])

  const [LogoMark, WordMark] = config.logo

  return (
    <Box position="sticky" top={0} px={[0, 0, 2]}>
      <Link to="/">
        <Box pt={0} pb={0} px={1} mb={[1, 2, 6]} color="textPrimary">
          {(!isMedium && !isLarge) || isLarge ? <WordMark /> : <LogoMark />}
        </Box>
      </Link>

      <Shelf
        gap={1}
        flexDirection={['row', 'row', 'column']}
        alignItems={['center', 'center', 'stretch']}
        justifyContent="space-evenly"
        px={[2, 2, 0]}
      >
        <NavigationItem
          label="Investments"
          href="/investments"
          icon={<IconInvestments size="16px" />}
          active={pathname.includes('investments')}
        />

        <NavigationItem label="NFTs" href="/nfts" icon={<IconNft size="16px" />} />

        {(pools.length > 0 || config.poolCreationType === 'immediate') && (
          <NavigationItem label="Issuer" href="issuer" icon={<IconUser size="16px" />} defaultOpen>
            {pools.map((pool) => (
              <PoolNavigationItem key={pool.id} pool={pool} />
            ))}
            {address && config.poolCreationType === 'immediate' && (
              <Shelf justifyContent="center" mt={1}>
                <RouterLinkButton to="/issuer/create-pool" variant="secondary" small>
                  Create pool
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
