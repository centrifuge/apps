import Centrifuge, { Pool, PoolMetadata, Rate } from '@centrifuge/centrifuge-js'
import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Box, InlineFeedback, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useLocation } from 'react-router'
import styled from 'styled-components'
import { getPoolValueLocked } from '../utils/getPoolValueLocked'
import { TinlakePool } from '../utils/tinlake/useTinlakePools'
import { useListedPools } from '../utils/useListedPools'
import { useMetadataMulti } from '../utils/useMetadata'
import { PoolCard, PoolCardProps } from './PoolCard'
import { PoolStatusKey } from './PoolCard/PoolStatus'
import { PoolFilter } from './PoolFilter'
import { filterPools } from './PoolFilter/utils'

export type MetaDataById = Record<string, PoolMetaDataPartial>
export type PoolMetaDataPartial = Partial<PoolMetadata> | undefined

const PoolCardBox = styled<typeof Box & { status?: PoolStatusKey }>(Box)`
  &:hover {
    cursor: ${(props) => (props.status === 'Upcoming' ? 'not-allowed' : 'default')};
  }
`

export function PoolList() {
  const cent = useCentrifuge()
  const { search } = useLocation()
  const [listedPools, , metadataIsLoading] = useListedPools()

  const centPools = listedPools.filter(({ id }) => !id.startsWith('0x')) as Pool[]
  const centPoolsMetaData: PoolMetaDataPartial[] = useMetadataMulti<PoolMetadata>(
    centPools?.map((p) => p.metadata) ?? []
  ).map((q) => q.data)
  const centPoolsMetaDataById = getMetasById(centPools, centPoolsMetaData)

  const upcomingPools = [
    {
      apr: Rate.fromApr(0.08),
      assetClass: 'Real Estate Bridge Loans',
      iconUri: 'https://storage.googleapis.com/tinlake/pool-media/new-silver-2/icon.svg',
      name: 'New Silver Series 3',
      status: 'Upcoming' as PoolStatusKey,
    },
    {
      apr: Rate.fromApr(0.15),
      assetClass: 'Voluntary Carbon Offsets',
      iconUri: 'https://storage.googleapis.com/tinlake/pool-media/flowcarbon-1/FlowcarbonBadge.svg',
      name: 'Flowcarbon Nature Offsets Series 2',
      status: 'Upcoming' as PoolStatusKey,
    },
  ]

  const pools = !!listedPools?.length
    ? [...upcomingPools, ...poolsToPoolCardProps(listedPools, centPoolsMetaDataById, cent)].sort((a, b) => {
        if (a.status === 'Upcoming') {
          return -1
        }
        if (b.status === 'Upcoming') {
          return 1
        }
        return 0
      })
    : [...upcomingPools]
  const filteredPools = !!pools?.length ? filterPools(pools, new URLSearchParams(search)) : []

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
    <Stack gap={1}>
      <Box overflow="auto">
        <PoolFilter pools={pools} />

        {!filteredPools.length ? (
          <Shelf px={2} mt={2} justifyContent="center">
            <Box px={2} py={1} borderRadius="input" backgroundColor="secondarySelectedBackground">
              <InlineFeedback status="info">No results found with these filters. Try different filters.</InlineFeedback>
            </Box>
          </Shelf>
        ) : (
          <Stack as="ul" role="list" gap={1} minWidth={970} py={1}>
            {metadataIsLoading
              ? Array(6)
                  .fill(true)
                  .map((_, index) => (
                    <Box as="li" key={`pool-list-loading-${index}`}>
                      <PoolCard isLoading={true} />
                    </Box>
                  ))
              : filteredPools.map((pool) => (
                  <PoolCardBox as="li" key={`pool-list-${pool.poolId}-${Math.random()}`} status={pool.status}>
                    <PoolCard {...pool} />
                  </PoolCardBox>
                ))}
          </Stack>
        )}
      </Box>
    </Stack>
  )
}

export function poolsToPoolCardProps(
  pools: (Pool | TinlakePool)[],
  metaDataById: MetaDataById,
  cent: Centrifuge
): PoolCardProps[] {
  return pools.map((pool) => {
    const tinlakePool = pool.id?.startsWith('0x') && (pool as TinlakePool)
    const mostSeniorTranche = pool?.tranches?.slice(1).at(-1)
    const metaData = typeof pool.metadata === 'string' ? metaDataById[pool.id] : pool.metadata

    return {
      poolId: pool.id,
      name: metaData?.pool?.name,
      assetClass: metaData?.pool?.asset.subClass,
      valueLocked: getPoolValueLocked(pool),
      currencySymbol: pool.currency.symbol,
      apr: mostSeniorTranche?.interestRatePerSec,
      status:
        tinlakePool && tinlakePool.addresses.CLERK !== undefined && tinlakePool.tinlakeMetadata.maker?.ilk
          ? 'Maker Pool'
          : pool.tranches.at(0)?.capacity.toFloat() // pool is displayed as "open for investments" if the most junior tranche has a capacity
          ? 'Open for investments'
          : ('Closed' as PoolStatusKey),
      iconUri: metaData?.pool?.icon?.uri ? cent.metadata.parseMetadataUrl(metaData?.pool?.icon?.uri) : undefined,
    }
  })
}

function getMetasById(pools: Pool[], poolMetas: PoolMetaDataPartial[]) {
  const result: MetaDataById = {}

  pools.forEach(({ id: poolId }, index) => {
    result[poolId] = poolMetas[index]
  })

  return result
}
