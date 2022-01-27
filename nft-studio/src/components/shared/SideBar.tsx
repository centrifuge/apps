import { Box, IconHome, IconNft, IconPieChart, IconUser, Shelf } from '@centrifuge/fabric'
import React from 'react'
import { useRouteMatch } from 'react-router'
import logoCentrifuge from '../../assets/images/logoCentrifuge.svg'
import { useIsAboveBreakpoint } from '../../utils/useIsAboveBreakpoint'
import { useDebugFlags } from '../DebugFlags'
import { NavigationItem } from './NavigationItem'

type Props = {}

export const SideBar: React.FC<Props> = () => {
  const investmentsMatch = useRouteMatch('/investments')
  const issuersMatch = useRouteMatch('/issuers')
  const isDesktop = useIsAboveBreakpoint('M')
  const { showOnlyNFT } = useDebugFlags()

  return (
    <Box
      background="backgroundPrimary"
      bleedX={['gutterMobile', 'gutterTablet', 0]}
      borderStyle="solid"
      borderColor="borderPrimary"
      borderWidth={['1px 0 0', '1px 0 0', 0]}
    >
      {isDesktop && (
        <Box marginBottom={8}>
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
        {!showOnlyNFT && <NavigationItem label="Pools" href="/pools" icon={<IconHome size="16px" />} />}
        <NavigationItem label="NFTs" href="/nfts" icon={<IconNft size="16px" />} />
        {!showOnlyNFT && (
          <>
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
          </>
        )}
      </Shelf>
    </Box>
  )
}
