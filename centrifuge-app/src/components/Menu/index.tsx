import {
  Box,
  IconGlobe,
  IconInvestments,
  IconNft,
  IconPlus,
  IconSwitch,
  IconWallet,
  MenuItemGroup,
  Shelf,
  Stack,
} from '@centrifuge/fabric'
import styled, { useTheme } from 'styled-components'
import { config } from '../../config'
import { useAddress } from '../../utils/useAddress'
import { useIsAboveBreakpoint } from '../../utils/useIsAboveBreakpoint'
import { usePoolsThatAnyConnectedAddressHasPermissionsFor } from '../../utils/usePermissions'
import { useTransactionsByAddress } from '../../utils/usePools'
import { useDebugFlags } from '../DebugFlags'
import { RouterLinkButton } from '../RouterLinkButton'
import { DashboardMenu } from './DashboardMenu'
import { GovernanceMenu } from './GovernanceMenu'
import { IssuerMenu } from './IssuerMenu'
import { NavManagementMenu } from './NavManagementMenu'
import { PageLink } from './PageLink'
import { PoolLink } from './PoolLink'

const COLOR = '#7C8085'

const StyledRouterLinkButton = styled(RouterLinkButton)`
  width: 100%;
  & > span {
    background-color: ${COLOR};
    border-color: transparent;
    color: white;
    margin-bottom: 20px;

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
  const isLarge = useIsAboveBreakpoint('L')
  const address = useAddress('substrate')
  const theme = useTheme()
  const { showSwaps, showDashboard } = useDebugFlags()
  const { data: transactions } = useTransactionsByAddress(address)

  return (
    <Shelf
      width="100%"
      position="relative"
      gap={1}
      flexDirection={['row', 'row', 'column']}
      alignItems={['center', 'center', 'stretch']}
      justifyContent={['space-between', 'space-between']}
      backgroundColor="backgroundInverted"
    >
      {showDashboard && pools.length > 0 && <DashboardMenu />}

      <Box width="100%">
        <PageLink to="/pools" stacked={!isLarge}>
          <IconInvestments size={['iconMedium', 'iconMedium', 'iconSmall']} />
          Pools
        </PageLink>
      </Box>

      <Box width="100%">
        <PageLink to="/portfolio" stacked={!isLarge}>
          <IconWallet size={['iconMedium', 'iconMedium', 'iconSmall']} />
          Portfolio
        </PageLink>
      </Box>

      <Box width="100%">
        <PageLink to="/prime" stacked={!isLarge}>
          <IconGlobe size={['iconMedium', 'iconMedium', 'iconSmall']} />
          Prime
        </PageLink>
      </Box>

      <Box width="100%">
        <GovernanceMenu />
      </Box>

      {(pools.length > 0 || config.poolCreationType === 'immediate') && !showDashboard && (
        <IssuerMenu defaultOpen={isLarge} stacked={!isLarge}>
          {isLarge ? (
            <Stack as="ul" gap={1}>
              {pools.map((pool) => (
                <Box key={pool.id} as="li" pl={4}>
                  <PoolLink pool={pool} />
                </Box>
              ))}
              {address && config.poolCreationType === 'immediate' && (
                <Shelf justifyContent="center" as="li" mt={1}>
                  <CreatePool />
                </Shelf>
              )}
            </Stack>
          ) : (
            <Stack as="ul" gap={1}>
              {!!pools.length &&
                pools.map((pool) => (
                  <MenuItemGroup key={pool.id}>
                    <Box px={2} py={1}>
                      <PoolLink pool={pool} />
                    </Box>
                  </MenuItemGroup>
                ))}
              {address && config.poolCreationType === 'immediate' && (
                <Box px={2} py={1}>
                  <CreatePool />
                </Box>
              )}
            </Stack>
          )}
        </IssuerMenu>
      )}

      {!showDashboard && <NavManagementMenu stacked={!isLarge} />}

      {config.network !== 'centrifuge' && (
        <PageLink to="/nfts" stacked={!isLarge}>
          <IconNft size={['iconMedium', 'iconMedium', 'iconSmall']} />
          NFTs
        </PageLink>
      )}

      {showDashboard && pools.length > 0 && (
        <Box mt={1}>
          <CreatePool />
        </Box>
      )}

      {showSwaps && (
        <Box>
          <Box
            width="100%"
            borderTopColor={theme.colors.borderSecondary}
            borderTopWidth={1}
            borderTopStyle="solid"
            mb={2}
          />
          <PageLink to="/swaps" stacked={!isLarge}>
            <IconSwitch size={['iconMedium', 'iconMedium', 'iconSmall']} />
            Swaps
          </PageLink>
        </Box>
      )}
    </Shelf>
  )
}

function CreatePool() {
  return (
    <StyledRouterLinkButton icon={<IconPlus size="iconSmall" />} to="/issuer/create-pool" small variant="inverted">
      Create pool
    </StyledRouterLinkButton>
  )
}
