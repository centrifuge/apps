import { CurrencyBalance, PoolMetadata } from '@centrifuge/centrifuge-js'
import BN from 'bn.js'
import * as React from 'react'
import { useMemo } from 'react'
import { useAddress } from '../utils/useAddress'
import { useMetadataMulti } from '../utils/useMetadata'
import { usePermissions } from '../utils/usePermissions'
import { usePools } from '../utils/usePools'
import { Dec } from './Decimal'
import { getPoolTVL } from './getPoolTVL'
import { useTinlakePools } from './tinlake/useTinlakePools'
import { useSubquery } from './useSubquery'

type FlattenedDataItem = {
  netAssetValue: string
  decimals: number
}

const sign = (n: BN) => (n.isZero() ? 0 : n.isNeg() ? -1 : 1)

export function useListedPools() {
  const pools = usePools()
  const tinlakePools = useTinlakePools(true)

  const address = useAddress('substrate')
  const permissions = usePermissions(address)

  const poolMetas = useMetadataMulti<PoolMetadata>(pools?.map((p) => p.metadata) ?? [])

  const [listedPools, listedTokens] = React.useMemo(
    () => {
      const poolVisibilities = pools?.map(({ id }) => !!permissions?.pools[id]) ?? []
      const listedTinlakePools = tinlakePools.data?.pools ?? []
      const listedTinlakeTokens = listedTinlakePools.flatMap((p) => p.tranches)
      const listedPools = pools?.filter((_, i) => poolMetas[i]?.data?.pool?.listed || poolVisibilities[i]) ?? []
      const listedTokens = listedPools.flatMap((p) => p.tranches)

      return [
        [...listedPools, ...listedTinlakePools].sort((a, b) => getPoolTVL(b) - getPoolTVL(a)),
        [...listedTokens, ...listedTinlakeTokens].sort((a, b) => sign(b.capacity.sub(a.capacity))),
      ]
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...poolMetas.map((q) => q.data), tinlakePools, address]
  )

  const isLoading = tinlakePools.isLoading || poolMetas.some((q) => q.isLoading)

  return [listedPools, listedTokens, isLoading] as const
}

export function getYearOverYearGrowth() {
  const [listedPools] = useListedPools()

  const { oneDayAgoFromOneYearAgo, nextDay } = useMemo(() => {
    const today = new Date()
    const oneYearAgo = new Date(Date.UTC(today.getUTCFullYear() - 1, today.getUTCMonth(), today.getUTCDate(), 0, 0, 0))

    const addOneDay = (date: Date): Date => {
      const newDate = new Date(date)
      newDate.setDate(date.getDate() + 1)
      return newDate
    }

    return {
      oneDayAgoFromOneYearAgo: oneYearAgo,
      nextDay: addOneDay(oneYearAgo),
    }
  }, [])

  const { data, isLoading } = useSubquery(
    `query ($oneDayAgoFromOneYearAgo: Datetime!, $nextDay: Datetime!) {
      pools {
        nodes {
          currency {
            decimals
          }
          poolSnapshots(
            filter: {
              timestamp: {
                greaterThan: $oneDayAgoFromOneYearAgo,
                lessThan: $nextDay
              }
            },
          ) {
            nodes {
              netAssetValue
              timestamp
            }
          }
        }
      }
    }`,
    {
      oneDayAgoFromOneYearAgo,
      nextDay,
    },
    {
      enabled: !!oneDayAgoFromOneYearAgo,
    }
  )

  const flattenedData =
    data?.pools?.nodes.flatMap((pool: any) =>
      pool.poolSnapshots.nodes.map((snapshot: any) => ({
        netAssetValue: snapshot.netAssetValue,
        decimals: pool.currency.decimals,
      }))
    ) || []

  // Aggregate NAV from last year
  const aggregatedNetAssetValue = flattenedData.reduce((accumulator: any, item: FlattenedDataItem) => {
    const netAssetValue = new CurrencyBalance(item.netAssetValue, item.decimals)
    return accumulator.add(netAssetValue.toDecimal())
  }, Dec(0))

  const aggregatedListedPoolsNav = listedPools.reduce((accumulator, pool) => {
    const decimal = pool.currency?.decimals ?? 0
    const navTotal = new CurrencyBalance(pool.nav.total, decimal)
    return accumulator.add(navTotal.toDecimal())
  }, Dec(0))

  const lastYearNAV = aggregatedNetAssetValue.toNumber()
  const currentYearNAV = aggregatedListedPoolsNav.toNumber()

  // YoY growth
  const totalValueLockedGrowth =
    lastYearNAV && currentYearNAV ? ((currentYearNAV - lastYearNAV) / lastYearNAV) * 100 : 0

  return { totalValueLockedGrowth, isLoading }
}
