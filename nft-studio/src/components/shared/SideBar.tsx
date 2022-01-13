import { Box, IconHome, IconNft, IconPieChart, IconUser, Stack } from '@centrifuge/fabric'
import React from 'react'
import { useRouteMatch } from 'react-router'
import logoCentrifuge from '../../assets/images/logoCentrifuge.svg'
import { NavigationItem } from './NavigationItem'

type Props = {}

export const SideBar: React.FC<Props> = () => {
  const investmentsMatch = useRouteMatch('/investments')
  const issuersMatch = useRouteMatch('/issuers')
  return (
    <Box>
      <Box marginTop={5} marginLeft={5} marginBottom={8}>
        <img src={logoCentrifuge} alt="" />
      </Box>
      <Stack gap={1} marginLeft={1} marginRight={1}>
        <NavigationItem label="Pools" href="/pools" icon={<IconHome size="16px" />} />
        <NavigationItem label="NFTs" href="/nfts" icon={<IconNft size="16px" />} />
        <NavigationItem label="Investments" icon={<IconPieChart size="16px" />} defaultOpen={!!investmentsMatch}>
          <NavigationItem label="Tokens" href="/investments/tokens" />
          <NavigationItem label="Portfolio" href="/investments/portfolio" />
          <NavigationItem label="Rewards" href="/investments/rewards" />
        </NavigationItem>
        <NavigationItem label="Issuers" icon={<IconUser size="16px" />} defaultOpen={!!issuersMatch}>
          <Stack gap={1} paddingTop={1}>
            <NavigationItem label="Managed pools" href="/issuers/managed-pools" />
            <NavigationItem label="Assets" href="/issuers/assets" />
            <NavigationItem label="Schemas" href="/issuers/schemas" />
            <NavigationItem label="Contacts" href="/issuers/contacts" />
          </Stack>
        </NavigationItem>
      </Stack>
    </Box>
  )
}
