import { Pool } from '@centrifuge/centrifuge-js'
import { Box, IconCircle, IconHome, IconNft, IconPieChart, IconUser, Shelf } from '@centrifuge/fabric'
import React from 'react'
import { useRouteMatch } from 'react-router'
import logoCentrifuge from '../assets/images/logoCentrifuge.svg'
import { useAddress } from '../utils/useAddress'
import { useIsAboveBreakpoint } from '../utils/useIsAboveBreakpoint'
import { usePermissions } from '../utils/usePermissions'
import { usePoolMetadata, usePools } from '../utils/usePools'
import { NavigationItem } from './NavigationItem'
import { RouterLinkButton } from './RouterLinkButton'

type Props = {}

export const Menu: React.FC<Props> = () => {
  const investmentsMatch = useRouteMatch('/investments')
  const issuersMatch = useRouteMatch('/issuer')
  const isDesktop = useIsAboveBreakpoint('M')

  const allPools = usePools()
  const address = useAddress()
  const permissions = usePermissions(address)

  const pools = React.useMemo(() => {
    if (!allPools || !permissions) {
      return []
    }
    return allPools.filter(({ id }) => permissions[id]?.roles.includes('PoolAdmin'))
  }, [allPools, permissions])

  return (
    <Box backgroundColor="backgroundPrimary" position="sticky" top={0} px={[0, 2]}>
      {isDesktop && (
        <Box py={3} px={1} mb={10}>
          <img src={logoCentrifuge} alt="" />
        </Box>
      )}
      <Shelf
        gap={1}
        flexDirection={['row', 'row', 'column']}
        alignItems={['center', 'center', 'stretch']}
        justifyContent="space-evenly"
        px={[2, 2, 0]}
      >
        <NavigationItem label="Tokens" href="/tokens" icon={<IconCircle size="16px" />} />
        <NavigationItem label="Pools" href="/pools" icon={<IconHome size="16px" />} />
        <NavigationItem label="NFTs" href="/nfts" icon={<IconNft size="16px" />} />
        <NavigationItem
          label="Investments"
          href="/investments"
          icon={<IconPieChart size="16px" />}
          defaultOpen={!!investmentsMatch}
        >
          <NavigationItem label="Tokens" href="/investments/tokens" />
          <NavigationItem label="Portfolio" href="/investments/portfolio" />
          <NavigationItem label="Rewards" href="/investments/rewards" />
        </NavigationItem>
        <NavigationItem label="Issuer" href="issuer" icon={<IconUser size="16px" />} defaultOpen={!!issuersMatch}>
          {pools.map((pool) => (
            <PoolNavigationItem key={pool.id} pool={pool} />
          ))}
          {address && (
            <Shelf justifyContent="center" mt={1}>
              <RouterLinkButton to="/issuer/create-pool" variant="outlined" small>
                Create Pool
              </RouterLinkButton>
            </Shelf>
          )}
        </NavigationItem>
      </Shelf>
    </Box>
  )
}

const PoolNavigationItem: React.FC<{ pool: Pool }> = ({ pool }) => {
  const { data: metadata } = usePoolMetadata(pool)

  return <NavigationItem label={metadata?.pool?.name ?? pool.id} href={`/issuer/${pool.id}`} />
}
