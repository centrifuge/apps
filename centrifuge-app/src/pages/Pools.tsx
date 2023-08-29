import Centrifuge, { Pool, PoolMetadata } from '@centrifuge/centrifuge-js'
import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Box, InlineFeedback, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useLocation } from 'react-router-dom'
import { LayoutBase } from '../components/LayoutBase'
import { PoolCardProps } from '../components/PoolCard'
import { PoolStatusKey } from '../components/PoolCard/PoolStatus'
import { PoolFilter } from '../components/PoolFilter'
import { filterPools } from '../components/PoolFilter/utils'
import { PoolList } from '../components/PoolList'
import { PoolsTokensShared } from '../components/PoolsTokensShared'
import { getPoolValueLocked } from '../utils/getPoolValueLocked'
import { TinlakePool } from '../utils/tinlake/useTinlakePools'
import { useListedPools } from '../utils/useListedPools'
import { useMetadataMulti } from '../utils/useMetadata'

type PoolMetaDataPartial = Partial<PoolMetadata> | undefined
type MetaDataById = Record<string, PoolMetaDataPartial>

export function PoolsPage() {
  return (
    <LayoutBase>
      <PoolsTokensShared title="Pools">
        <Pools />
      </PoolsTokensShared>
    </LayoutBase>
  )
}

function Pools() {
  const cent = useCentrifuge()
  const { search } = useLocation()
  const [listedPools, listedTokens, metadataIsLoading] = useListedPools()
  console.log('listedPools', listedPools)

  const centPools = listedPools.filter(({ id }) => !id.startsWith('0x')) as Pool[]
  const centPoolsMetaData: PoolMetaDataPartial[] = useMetadataMulti<PoolMetadata>(
    centPools?.map((p) => p.metadata) ?? []
  ).map((q) => q.data)
  const centPoolsMetaDataById = getMetasById(centPools, centPoolsMetaData)

  const pools = !!listedPools?.length ? poolsToPoolCardProps(listedPools, centPoolsMetaDataById, cent) : []
  console.log('pools', pools)
  const filteredPools = !!pools?.length ? filterPools(pools, new URLSearchParams(search)) : []
  console.log('flfitleirlerpOPopolp', filteredPools)

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
          <PoolList pools={filteredPools} isLoading={metadataIsLoading} />
        )}
      </Box>
    </Stack>
  )
}

function getMetasById(pools: Pool[], poolMetas: PoolMetaDataPartial[]) {
  const result: MetaDataById = {}

  pools.forEach(({ id: poolId }, index) => {
    result[poolId] = poolMetas[index]
  })

  return result
}

function poolsToPoolCardProps(
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
      assetClass: metaData?.pool?.asset.class,
      valueLocked: getPoolValueLocked(pool),
      currencySymbol: pool.currency.symbol,
      apr: mostSeniorTranche?.interestRatePerSec,
      status:
        tinlakePool && tinlakePool.addresses.CLERK !== undefined && tinlakePool.tinlakeMetadata.maker?.ilk
          ? 'Maker Pool'
          : pool.tranches.at(-1)?.capacity.toFloat()
          ? 'Open for investments'
          : ('Closed' as PoolStatusKey),
      iconUri: metaData?.pool?.icon?.uri ? cent.metadata.parseMetadataUrl(metaData?.pool?.icon?.uri) : undefined,
    }
  })
}
