import Centrifuge, { Pool } from '@centrifuge/centrifuge-js'
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
import { useAsyncMemo } from '../utils/useAsyncMemo'
import { useListedPools } from '../utils/useListedPools'
import { metadataQueryFn } from '../utils/useMetadata'

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

  const pools = useAsyncMemo(async () => {
    return !!listedPools?.length ? await formatPoolsData(listedPools, cent) : []
  }, [listedPools.length])

  const filteredPools = React.useMemo(() => {
    if (!pools?.length) {
      return []
    }

    const searchParams = new URLSearchParams(search)
    return filterPools(pools, searchParams)
  }, [search, pools])

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
    </Stack>
  )
}

async function formatPoolsData(pools: (Pool | TinlakePool)[], cent: Centrifuge): Promise<PoolCardProps[]> {
  const promises = pools.map(async (pool) => {
    const tinlakePool = pool.id?.startsWith('0x') && (pool as TinlakePool)
    const mostSeniorTranche = pool?.tranches?.slice(1).at(-1)
    const metaData = typeof pool.metadata === 'string' ? await metadataQueryFn(pool.metadata, cent) : pool.metadata

    return {
      poolId: pool.id,
      name: metaData.pool.name as string,
      assetClass: metaData.pool.asset.class as string,
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
  const data = await Promise.all(promises)

  return data
}
