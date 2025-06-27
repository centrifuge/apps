import Centrifuge, { Pool, PoolMetadata } from '@centrifuge/centrifuge-js'
import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Box, Grid, IconChevronRight, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useLocation } from 'react-router'
import styled from 'styled-components'
import { getPoolValueLocked } from '../utils/getPoolValueLocked'
import { TinlakePool } from '../utils/tinlake/useTinlakePools'
import { useListedPools } from '../utils/useListedPools'
import { useMetadataMulti } from '../utils/useMetadata'
import { PoolCard, PoolCardProps } from './PoolCard'
import { PoolListView } from './PoolCard/PoolListView'
import { PoolStatusKey } from './PoolCard/PoolStatus'

export type MetaDataById = Record<string, PoolMetaDataPartial>
export type PoolMetaDataPartial = Partial<PoolMetadata> | undefined

const PoolCardBox = styled<typeof Box & { status?: PoolStatusKey }>(Box)`
  &:hover {
    cursor: ${(props) => (props.status === 'Upcoming' ? 'not-allowed' : 'default')};
  }
`

const StyledBox = styled(Box)`
  background-color: transparent;
  border: none;
  &:hover {
    svg {
      color: ${({ theme }) => theme.colors.textGold};
    }
    div {
      color: ${({ theme }) => theme.colors.textGold};
    }
  }
`

const upcomingPools: PoolCardProps[] = []

export function PoolList() {
  const cent = useCentrifuge()
  const { search } = useLocation()
  const [showArchived, setShowArchived] = React.useState(false)
  const [listedPools, , metadataIsLoading] = useListedPools()

  const centPools = listedPools.filter(({ id }) => !id.startsWith('0x')) as Pool[]
  const centPoolsMetaData: PoolMetaDataPartial[] = useMetadataMulti<PoolMetadata>(
    centPools?.map((p) => p.metadata) ?? []
  ).map((q) => q.data)
  const centPoolsMetaDataById = getMetasById(centPools, centPoolsMetaData)

  const [pools, filteredPools] = React.useMemo(() => {
    const pools = !!listedPools?.length ? poolsToPoolCardProps(listedPools, centPoolsMetaDataById, cent) : []
    const openInvestmentPools = pools
      .filter((pool) => pool.status === 'Open for investments' && !pool?.poolId?.startsWith('0x') && pool?.valueLocked)
      .sort((a, b) => (b?.valueLocked && a?.valueLocked ? b?.valueLocked?.sub(a?.valueLocked).toNumber() : 0))
    const tinlakePools = pools
      .filter((pool) => pool?.poolId?.startsWith('0x'))
      .filter((pool) => !pool?.status?.includes('Archived'))
      .sort((a, b) => (b?.valueLocked && a?.valueLocked ? b.valueLocked.sub(a.valueLocked).toNumber() : 0))

    const sortedPools = [...openInvestmentPools, ...upcomingPools, ...tinlakePools]
    return [pools, sortedPools]
  }, [listedPools, search, cent, centPoolsMetaDataById])

  const archivedPools = pools.filter((pool) => pool?.status?.includes('Archived'))

  if (!listedPools.length) {
    return (
      <Shelf p={4} justifyContent="center" textAlign="center">
        <Text variant="heading2" color="textSecondary">
          There are no pools yet
        </Text>
      </Shelf>
    )
  }

  return (
    <Stack>
      <Stack>
        <Box overflow="auto">
          <Grid as="ul" role="list" gap={3} gridTemplateColumns={['1fr', '1fr', '1fr 1fr', '1fr 1fr', '1fr 1fr 1fr']}>
            {metadataIsLoading
              ? Array(3)
                  .fill(true)
                  .map((_, index) => (
                    <Box as="li" key={index}>
                      <PoolCard />
                    </Box>
                  ))
              : filteredPools.map((pool) => (
                  <PoolCardBox as="li" key={pool.poolId} status={pool.status}>
                    <PoolCard {...pool} />
                  </PoolCardBox>
                ))}
          </Grid>
        </Box>
      </Stack>
      {!metadataIsLoading && archivedPools.length > 0 && (
        <>
          <StyledBox display="flex" alignItems="center" marginTop={2} marginBottom={2} as="button">
            <Text
              style={{ cursor: 'pointer' }}
              color="textSecondary"
              onClick={() => setShowArchived((show) => !show)}
              variant="body2"
            >
              {showArchived ? 'Hide archived pools' : 'View archived pools'}
            </Text>
            {!showArchived && <IconChevronRight color="textSecondary" size={18} />}
          </StyledBox>
          {showArchived && <ArchivedPools pools={archivedPools} />}
        </>
      )}
    </Stack>
  )
}

function ArchivedPools({ pools }: { pools: PoolCardProps[] }) {
  return (
    <Stack gap={1} overflow="auto">
      <Grid columns={[1]} as="ul" role="list" gap={1}>
        {pools.map((pool) => (
          <PoolCardBox as="li" key={pool.poolId} status={pool.status}>
            <PoolListView {...pool} />
          </PoolCardBox>
        ))}
      </Grid>
    </Stack>
  )
}

export function poolsToPoolCardProps(
  pools: (Pool | TinlakePool)[],
  metaDataById: MetaDataById,
  cent: Centrifuge
): PoolCardProps[] {
  return pools.map((pool) => {
    const metaData = typeof pool.metadata === 'string' ? metaDataById[pool.id] : pool.metadata
    return {
      poolId: pool.id,
      name: metaData?.pool?.name,
      assetClass: metaData?.pool?.asset.subClass,
      valueLocked: getPoolValueLocked(pool),
      currencySymbol: pool.currency.symbol,
      status: getPoolStatus(pool),
      iconUri: metaData?.pool?.icon?.uri ? cent.metadata.parseMetadataUrl(metaData?.pool?.icon?.uri) : undefined,
      tranches: pool.tranches,
      metaData: metaData as PoolMetadata,
      createdAt: pool.createdAt ?? '',
    }
  })
}

export function getPoolStatus(pool: Pool | TinlakePool): PoolStatusKey {
  const tinlakePool = pool.id?.startsWith('0x') && (pool as TinlakePool)

  if (tinlakePool && tinlakePool.tinlakeMetadata.isArchived) {
    return 'Archived'
  }

  if (tinlakePool && tinlakePool.addresses.CLERK !== undefined && tinlakePool.tinlakeMetadata.maker?.ilk) {
    return 'Closed'
  }

  if (pool.tranches.at(0)?.capacity?.toFloat()) {
    return 'Open for investments'
  }

  return 'Closed'
}

function getMetasById(pools: Pool[], poolMetas: PoolMetaDataPartial[]) {
  const result: MetaDataById = {}

  pools.forEach(({ id: poolId }, index) => {
    result[poolId] = poolMetas[index]
  })

  return result
}
