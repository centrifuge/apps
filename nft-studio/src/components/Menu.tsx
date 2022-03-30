import { Box, IconCircle, IconHome, IconNft, IconPieChart, IconUser, Shelf } from '@centrifuge/fabric'
import React from 'react'
import { useRouteMatch } from 'react-router'
import logoCentrifuge from '../assets/images/logoCentrifuge.svg'
import { useIsAboveBreakpoint } from '../utils/useIsAboveBreakpoint'
import { NavigationItem } from './NavigationItem'

type Props = {}

export const Menu: React.FC<Props> = () => {
  const investmentsMatch = useRouteMatch('/investments')
  const issuersMatch = useRouteMatch('/issuers')
  const isDesktop = useIsAboveBreakpoint('M')

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
        <NavigationItem label="Issuers" href="issuers" icon={<IconUser size="16px" />} defaultOpen={!!issuersMatch}>
          <NavigationItem label="Managed pools" href="/issuers/managed-pools" />
          <NavigationItem label="Assets" href="/issuers/assets" />
          <NavigationItem label="Schemas" href="/issuers/schemas" />
          <NavigationItem label="Contacts" href="/issuers/contacts" />
        </NavigationItem>
      </Shelf>
    </Box>
  )
}
