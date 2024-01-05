import {
  Box,
  IconClock,
  IconGlobe,
  IconInvestments,
  IconNft,
  IconPieChart,
  IconSwitch,
  Menu as Panel,
  MenuItemGroup,
  Shelf,
  Stack,
} from '@centrifuge/fabric'
import { config } from '../../config'
import { useAddress } from '../../utils/useAddress'
import { useIsAboveBreakpoint } from '../../utils/useIsAboveBreakpoint'
import { usePoolsThatAnyConnectedAddressHasPermissionsFor } from '../../utils/usePermissions'
import { useTransactionsByAddress } from '../../utils/usePools'
import { useDebugFlags } from '../DebugFlags'
import { RouterLinkButton } from '../RouterLinkButton'
import { GovernanceMenu } from './GovernanceMenu'
import { IssuerMenu } from './IssuerMenu'
import { PageLink } from './PageLink'
import { PoolLink } from './PoolLink'

export function Menu() {
  const pools = usePoolsThatAnyConnectedAddressHasPermissionsFor() || []
  const isLarge = useIsAboveBreakpoint('L')
  const address = useAddress('substrate')
  const { showSwaps, showPrime } = useDebugFlags()
  const transactions = useTransactionsByAddress(address)

  return (
    <Shelf
      width="100%"
      position="relative"
      gap={1}
      flexDirection={['row', 'row', 'column']}
      alignItems={['center', 'center', 'stretch']}
    >
      <PageLink to="/pools" stacked={!isLarge}>
        <IconInvestments />
        Pools
      </PageLink>

      <PageLink to="/portfolio" stacked={!isLarge}>
        <IconPieChart />
        Portfolio
      </PageLink>

      {address && (transactions ?? null) && (
        <PageLink to="/history" stacked={!isLarge}>
          <IconClock />
          History
        </PageLink>
      )}

      {showPrime && (
        <PageLink to="/prime" stacked={!isLarge}>
          <IconGlobe />
          Prime
        </PageLink>
      )}

      <GovernanceMenu />

      {(pools.length > 0 || config.poolCreationType === 'immediate') && (
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
            <Panel>
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
            </Panel>
          )}
        </IssuerMenu>
      )}

      {showSwaps && (
        <PageLink to="/swaps" stacked={!isLarge}>
          <IconSwitch />
          Swaps
        </PageLink>
      )}

      {config.network !== 'centrifuge' && (
        <PageLink to="/nfts" stacked={!isLarge}>
          <IconNft />
          NFTs
        </PageLink>
      )}
    </Shelf>
  )
}

function CreatePool() {
  return (
    <RouterLinkButton to="/issuer/create-pool" variant="secondary" small>
      Create pool
    </RouterLinkButton>
  )
}
