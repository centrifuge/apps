import {
  Box,
  IconDashboard,
  IconGlobe,
  IconGovernance,
  IconInvestments,
  IconNft,
  IconPlus,
  IconSwitch,
  IconWallet,
  Text,
} from '@centrifuge/fabric'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useIsAboveBreakpoint } from '../../../src/utils/useIsAboveBreakpoint'
import { config } from '../../config'
import { usePoolsThatAnyConnectedAddressHasPermissionsFor } from '../../utils/usePermissions'
import { useDebugFlags } from '../DebugFlags'
import { RouterLinkButton } from '../RouterLinkButton'
import { SubMenu } from './SubMenu'

const COLOR = '#7C8085'

export const StyledRouterButton = styled(Text)<{ isLarge?: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: ${({ isLarge }) => (isLarge ? 'center' : 'flex-start')};
  padding: 6px;
  margin: 4px;
  border-radius: 4px;
  &:hover {
    & > div {
      color: ${({ theme }) => theme.colors.textGold};
    }
    & > svg {
      color: ${({ theme }) => theme.colors.textGold};
    }
    background-color: rgba(145, 150, 155, 0.13);
  }
`

const StyledRouterLinkButton = styled(RouterLinkButton)`
  width: 100%;
  margin-top: 12px;
  & > span {
    background-color: ${COLOR};
    border-color: transparent;
    color: white;
    margin-bottom: 20px;
    font-size: ${({ theme }) => theme.colors.textGold};

    &:hover {
      box-shadow: 0px 0px 0px 3px #7c8085b3;
      background-color: ${COLOR};
      color: white;
    }

    &:active {
      border-color: transparent;
    }
  }
`

export function Menu() {
  const pools = usePoolsThatAnyConnectedAddressHasPermissionsFor() || []
  const { showSwaps, hideApp } = useDebugFlags()
  const iconSize = 'iconSmall'
  const isLarge = useIsAboveBreakpoint('L')

  const menuItems = hideApp
    ? []
    : [
        {
          label: 'Dashboard',
          icon: <IconDashboard size={iconSize} color="white" />,
          subMenu: ['Account', 'Assets', 'Investors'],
          enabled: pools.length > 0,
          route: '/dashboard',
          withToggle: false,
        },
        { label: 'Pools', icon: <IconInvestments size={iconSize} color="white" />, route: '/pools', enabled: true },
        { label: 'Portfolio', icon: <IconWallet size={iconSize} color="white" />, route: '/portfolio', enabled: true },
        { label: 'Prime', icon: <IconGlobe size={iconSize} color="white" />, route: '/prime', enabled: true },
        {
          label: 'Governance',
          icon: <IconGovernance size={iconSize} color="white" />,
          subMenu: ['Onchain voting', 'Offchain voting', 'Governance forum'],
          enabled: true,
          withToggle: true,
        },
        {
          label: 'NFTs',
          icon: <IconNft size={iconSize} color="white" />,
          route: '/nfts',
          enabled: config.network !== 'centrifuge',
        },
        { label: 'Swaps', icon: <IconSwitch size={iconSize} color="white" />, route: '/swaps', enabled: showSwaps },
      ]

  return (
    <Box width="100%" display="flex" flexDirection="column" mt={isLarge ? 6 : 0}>
      {menuItems.map((item, index) => {
        if (!item.enabled) return null
        return (
          <>
            {item.subMenu ? (
              <SubMenu label={item.label} icon={item.icon} links={item.subMenu} withToggle={item.withToggle} />
            ) : (
              <StyledRouterButton as={Link} key={item.label + index} isLarge={isLarge} to={item.route}>
                {item.icon}
                <Text color="white" variant="body2" style={{ marginLeft: 8 }}>
                  {item.label}
                </Text>
              </StyledRouterButton>
            )}
          </>
        )
      })}
      {pools.length > 0 && <CreatePool />}
    </Box>
  )
}

function CreatePool() {
  return (
    <StyledRouterLinkButton icon={<IconPlus size="iconSmall" />} to="/create-pool" small variant="inverted">
      Create pool
    </StyledRouterLinkButton>
  )
}
