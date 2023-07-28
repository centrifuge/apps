import Centrifuge, { Pool, Rate } from '@centrifuge/centrifuge-js'
import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Box, Grid, Shelf, Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import * as React from 'react'
import { useLocation } from 'react-router-dom'
// import { Shelf, Text } from '@centrifuge/fabric'
// import * as React from 'react'
import { LayoutBase } from '../components/LayoutBase'
// import { CardTotalValueLocked } from '../components/CardTotalValueLocked'
// import { LoadBoundary } from '../components/LoadBoundary'
import { MenuSwitch } from '../components/MenuSwitch'
// import { PageWithSideBar } from '../components/PageWithSideBar'
import { PoolFilter } from '../components/PoolFilter'
import { filterPools } from '../components/PoolFilter/utils'
// import { PoolList } from '../components/PoolList'
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

const Pools: React.FC = () => {
  const cent = useCentrifuge()
  const { search } = useLocation()
  const [listedPools, listedTokens, metadataIsLoading] = useListedPools()

  const pools = useAsyncMemo(async () => {
    return !!listedPools?.length ? formatPoolsData(listedPools, cent) : []
  }, [])

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
    <Stack gap={0} flex={1}>
      <PoolFilter />

      {/* <PoolList
      pools={filtered ? listedPools.filter(({ reserve }) => reserve.max.toFloat() > 0) : listedPools}
      isLoading={metadataIsLoading}
    /> */}

      <Stack gap={1}>
        {filteredPools?.map((pool) => (
          <Grid key={pool.name} backgroundColor="pink" gridTemplateColumns="repeat(4, 1fr)">
            <Box>{pool.name}</Box>
            <Box>{pool.status}</Box>
            <Box>{pool.assetClass}</Box>
            <Box>{pool.valueLocked.toString()}</Box>
          </Grid>
        ))}
      </Stack>

      <MenuSwitch />
    </Stack>
  )
}

// Todo: move to PoolCard
export type PoolCardProps = {
  name: string
  assetClass: string
  valueLocked: Decimal
  apr: Rate | null | undefined
  status: string
}

async function formatPoolsData(pools: (Pool | TinlakePool)[], cent: Centrifuge): Promise<PoolCardProps[]> {
  const promises = pools.map(async (pool) => {
    const tinlakePool = pool.id?.startsWith('0x') && (pool as TinlakePool)
    const mostSeniorTranche = pool?.tranches?.slice(1).at(-1)
    const metaData = typeof pool.metadata === 'string' ? await metadataQueryFn(pool.metadata, cent) : pool.metadata

    return {
      name: metaData.pool.name as string,
      assetClass: metaData.pool.asset.class as string,
      valueLocked: getPoolValueLocked(pool),
      apr: mostSeniorTranche?.interestRatePerSec,
      status:
        tinlakePool && tinlakePool.addresses.CLERK !== undefined && tinlakePool.tinlakeMetadata.maker?.ilk
          ? 'Maker Pool'
          : pool.tranches.at(-1)?.capacity.toFloat()
          ? 'Open for investments'
          : 'Closed',
    }
  })
  const data = await Promise.all(promises)

  return data
}
