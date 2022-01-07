import { Box, IconHome, IconNft, IconPieChart, IconUser, Stack } from '@centrifuge/fabric'
import React from 'react'
import logoCentrifuge from '../../assets/images/logoCentrifuge.svg'
import { NavigationItem } from './NavigationItem'

type Props = {}

export const SideBar: React.FC<Props> = () => {
  return (
    <Box>
      <Box marginTop={5} marginLeft={5} marginBottom={8}>
        <img src={logoCentrifuge} alt="" />
      </Box>
      <Stack gap={1} marginLeft={1} marginRight={1}>
        <NavigationItem label="Pools" href="/pools" icon={<IconHome size="16px" />} />
        <NavigationItem label="NFTs" href="/nfts" icon={<IconNft size="16px" />} />
        <NavigationItem label="Investments" icon={<IconPieChart size="16px" />}>
          <NavigationItem label="Tokens" href="/tokens" />
          <NavigationItem label="Portfolio" href="/portfolio" />
          <NavigationItem label="Rewards" href="/rewards" />
        </NavigationItem>
        <NavigationItem label="Issuers" icon={<IconUser size="16px" />}>
          <Stack gap={1} paddingTop={1}>
            <NavigationItem label="Managed pools" href="/managed-pools" />
            <NavigationItem label="Assets" href="/assets" />
            <NavigationItem label="Schemas" href="/schemas" />
            <NavigationItem label="Contacts" href="/contacts" />
          </Stack>
        </NavigationItem>
      </Stack>
    </Box>
  )
}
