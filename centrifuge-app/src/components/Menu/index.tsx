import {
  Box,
  IconClock,
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

export const StyledRouterButton = styled(Text)<{ isIpad?: boolean }>`
  display: flex;
  flex-direction: ${({ isIpad }) => (isIpad ? 'column' : 'row')};
  align-items: center;
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

const StyledRouterLinkButton = styled(RouterLinkButton)<{ isIpad?: boolean }>`
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
  const { showSwaps } = useDebugFlags()
  const iconSize = ['iconSmall', 'iconLarge', 'iconSmall']
  const isMedium = useIsAboveBreakpoint('M')
  const isLarge = useIsAboveBreakpoint('L')
  const isIpad = isMedium && !isLarge

  const menuItems = [
    {
      label: 'Dashboard',
      icon: <IconDashboard size={iconSize} color="white" />,
      subMenu: ['Account', 'assets', 'investors'],
      enabled: true,
      route: '/dashboard',
      withToggle: false,
    },
    { label: 'Pools', icon: <IconInvestments size={iconSize} color="white" />, route: '/pools', enabled: true },
    { label: 'Portfolio', icon: <IconWallet size={iconSize} color="white" />, route: '/portfolio', enabled: true },
    { label: 'History', icon: <IconClock size={iconSize} color="white" />, route: '/history', enabled: true },
    { label: 'Prime', icon: <IconGlobe size={iconSize} color="white" />, route: '/prime', enabled: true },
    {
      label: 'Governance',
      icon: <IconGovernance size={iconSize} color="white" />,
      subMenu: ['Onchain voting', 'Offchain voting', 'Governance forum'],
      enabled: true,
      withToggle: isLarge,
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
    <Box width="100%" display="flex" flexDirection="column" mt={6}>
      {menuItems.map((item, index) => {
        if (!item.enabled) return null
        return (
          <>
            {item.subMenu ? (
              <SubMenu label={item.label} icon={item.icon} links={item.subMenu} withToggle={item.withToggle} />
            ) : (
              <StyledRouterButton as={Link} key={item.label + index} isIpad={isIpad} to={item.route}>
                {item.icon}
                <Text color="white" variant={isIpad ? 'body3' : 'body2'} style={{ marginLeft: 8 }}>
                  {item.label}
                </Text>
              </StyledRouterButton>
            )}
          </>
        )
      })}
      <CreatePool />
    </Box>
  )
}

function CreatePool() {
  const aboveM = useIsAboveBreakpoint('M')
  const aboveL = useIsAboveBreakpoint('L')
  const isIpad = aboveM && !aboveL

  return (
    <StyledRouterLinkButton
      icon={<IconPlus size="iconSmall" />}
      to="/create-pool"
      small
      variant="inverted"
      isIpad={isIpad}
    >
      Create pool
    </StyledRouterLinkButton>
  )
}
