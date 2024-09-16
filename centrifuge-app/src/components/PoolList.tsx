import Centrifuge, { Pool, PoolMetadata } from '@centrifuge/centrifuge-js'
import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Box, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useLocation } from 'react-router'
import styled from 'styled-components'
import { getPoolValueLocked } from '../utils/getPoolValueLocked'
import { TinlakePool } from '../utils/tinlake/useTinlakePools'
import { useIsAboveBreakpoint } from '../utils/useIsAboveBreakpoint'
import { useListedPools } from '../utils/useListedPools'
import { useMetadataMulti } from '../utils/useMetadata'
import { MetaData, PoolCard, PoolCardProps, Tranche } from './PoolCard'
import { PoolStatusKey } from './PoolCard/PoolStatus'
import { filterPools } from './PoolFilter/utils'

export type MetaDataById = Record<string, PoolMetaDataPartial>
export type PoolMetaDataPartial = Partial<PoolMetadata> | undefined

const PoolCardBox = styled<typeof Box & { status?: PoolStatusKey }>(Box)`
  &:hover {
    cursor: ${(props) => (props.status === 'Upcoming' ? 'not-allowed' : 'default')};
  }
`

const upcomingPools: PoolCardProps[] = []

export function PoolList() {
  const cent = useCentrifuge()
  const { search } = useLocation()
  const [showArchived, setShowArchived] = React.useState(false)
  const [listedPools, , metadataIsLoading] = useListedPools()
  const isLarge = useIsAboveBreakpoint('L')
  const isMedium = useIsAboveBreakpoint('M')
  const isExtraLarge = useIsAboveBreakpoint('XL')

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
    return [pools, search ? filterPools([...pools, ...upcomingPools], new URLSearchParams(search)) : sortedPools]
  }, [listedPools, search])

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
          <Box as="ul" role="list" display="flex" flexWrap="wrap">
            {metadataIsLoading
              ? Array(6)
                  .fill(true)
                  .map((_, index) => (
                    <Box as="li" key={index} width={isExtraLarge ? '25%' : isLarge ? '33%' : isMedium ? '48%' : '100%'}>
                      <PoolCard />
                    </Box>
                  ))
              : filteredPools.map((pool) => (
                  <PoolCardBox
                    as="li"
                    key={pool.poolId}
                    status={pool.status}
                    width={isExtraLarge ? '25%' : isLarge ? '33%' : isMedium ? '48%' : '100%'}
                  >
                    <PoolCard {...pool} />
                  </PoolCardBox>
                ))}
          </Box>
        </Box>
      </Stack>
      {!metadataIsLoading && archivedPools.length > 0 && (
        <>
          <Text
            style={{ cursor: 'pointer', marginBottom: 12 }}
            color="textSecondary"
            onClick={() => setShowArchived((show) => !show)}
            variant="body2"
          >
            {showArchived ? 'Hide archived pools' : 'View archived pools >'}
          </Text>
          {showArchived && <ArchivedPools pools={archivedPools} />}
        </>
      )}
    </Stack>
  )
}

function ArchivedPools({ pools }: { pools: PoolCardProps[] }) {
  const isMedium = useIsAboveBreakpoint('M')
  const isLarge = useIsAboveBreakpoint('L')
  const isExtraLarge = useIsAboveBreakpoint('XL')
  return (
    <Stack gap={1} overflow="auto">
      <Box as="ul" role="list" display="flex" flexWrap="wrap">
        {pools.map((pool) => (
          <PoolCardBox
            as="li"
            key={pool.poolId}
            status={pool.status}
            width={isExtraLarge ? '25%' : isLarge ? '33%' : isMedium ? '48%' : '100%'}
          >
            <PoolCard {...pool} />
          </PoolCardBox>
        ))}
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
    const metaData = typeof pool.metadata === 'string' ? metaDataById[pool.id] : pool.metadata

    return {
      poolId: pool.id,
      name: metaData?.pool?.name,
      assetClass: metaData?.pool?.asset.subClass,
      valueLocked: getPoolValueLocked(pool),
      currencySymbol: pool.currency.symbol,
      status:
        tinlakePool && tinlakePool.tinlakeMetadata.isArchived
          ? 'Archived'
          : tinlakePool && tinlakePool.addresses.CLERK !== undefined && tinlakePool.tinlakeMetadata.maker?.ilk
          ? 'Closed'
          : pool.tranches.at(0)?.capacity?.toFloat() // pool is displayed as "open for investments" if the most junior tranche has a capacity
          ? 'Open for investments'
          : ('Closed' as PoolStatusKey),
      iconUri: metaData?.pool?.icon?.uri ? cent.metadata.parseMetadataUrl(metaData?.pool?.icon?.uri) : undefined,
      tranches: pool.tranches as Tranche[],
      metaData: metaData as MetaData,
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
