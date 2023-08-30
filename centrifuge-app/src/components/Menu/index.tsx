import { Box, IconInvestments, IconNft, Menu as Panel, MenuItemGroup, Shelf, Stack } from '@centrifuge/fabric'
import { config } from '../../config'
import { useAddress } from '../../utils/useAddress'
import { useIsAboveBreakpoint } from '../../utils/useIsAboveBreakpoint'
import { usePools } from '../../utils/usePools'
import { RouterLinkButton } from '../RouterLinkButton'
import { GovernanceMenu } from './GovernanceMenu'
import { IssuerMenu } from './IssuerMenu'
import { PageLink } from './PageLink'
import { PoolLink } from './PoolLink'

export function Menu() {
  // const pools = usePoolsThatAnyConnectedAddressHasPermissionsFor() || []
  const pools = usePools() || []
  const isLarge = useIsAboveBreakpoint('L')
  const address = useAddress('substrate')

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

      {config.network !== 'centrifuge' && (
        <PageLink to="/nfts" stacked={!isLarge}>
          <IconNft />
          NFTs
        </PageLink>
      )}

      <GovernanceMenu />

      {(pools.length > 0 || config.poolCreationType === 'immediate') && (
        <IssuerMenu defaultOpen={isLarge} stacked={!isLarge} poolIds={pools.map(({ id }) => id)}>
          {isLarge ? (
            <Stack as="ul" gap={1}>
              {!!pools.length &&
                pools.map((pool) => (
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
