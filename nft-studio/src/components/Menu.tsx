import { Pool } from '@centrifuge/centrifuge-js'
import { Box, IconCircle, IconHome, IconNft, IconPieChart, IconUser, Shelf } from '@centrifuge/fabric'
import React from 'react'
import { useRouteMatch } from 'react-router'
import { Link } from 'react-router-dom'
import logoCentrifuge from '../assets/images/logoCentrifuge.svg'
import logoCentrifugeFull from '../assets/images/logoCentrifugeFull.svg'
import { useAddress } from '../utils/useAddress'
import { usePermissions } from '../utils/usePermissions'
import { usePoolMetadata, usePools } from '../utils/usePools'
import { NavigationItem } from './NavigationItem'
import { RouterLinkButton } from './RouterLinkButton'

type Props = {}

export const Menu: React.FC<Props> = () => {
  const investmentsMatch = useRouteMatch('/investments')
  const issuersMatch = useRouteMatch('/issuer')

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
    <Box backgroundColor="backgroundPrimary" position="sticky" top={0} px={2}>
      <Link to="/">
        <Box py={3} px={1} mb={10} display={['none', 'none', 'block']}>
          <img src={logoCentrifugeFull} alt="" />
        </Box>
        <Box py={3} px={1} mb={10} display={['block', 'block', 'none']}>
          <img src={logoCentrifuge} alt="" />
        </Box>
      </Link>
      <Shelf gap={1} flexDirection="column" alignItems="stretch" justifyContent="space-evenly" px={[2, 2, 0]}>
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
