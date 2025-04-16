import { CurrencyBalance, Loan, Perquintill, Pool, PoolMetadata, Token } from '@centrifuge/centrifuge-js'
import Decimal from 'decimal.js-light'
import { useMemo } from 'react'
import { daysBetween } from '../../../src/utils/date'
import { formatPercentage } from '../../../src/utils/formatting'
import { LoanTemplate } from '../../types'
import { Dec } from '../../utils/Decimal'
import { usePoolMetadataMulti } from '../../utils/usePools'
import { useSubquery } from '../../utils/useSubquery'
import { getAmount } from '../LoanList'
import { CreateAssetFormValues } from './Assets/CreateAssetsDrawer'

type FlattenedDataItem = {
  netAssetValue: string
  decimals: number
}

export type TransformedLoan = Loan & {
  pool: Pool
  outstandingQuantity: CurrencyBalance
  presentValue: CurrencyBalance
}

export const hasValuationMethod = (
  pricing: any
): pricing is { valuationMethod: string; presentValue: CurrencyBalance } => {
  return pricing && typeof pricing.valuationMethod === 'string'
}

export const useLoanCalculations = (transformedLoans: TransformedLoan[]) => {
  const totalLoans = useMemo(() => transformedLoans.length, [transformedLoans])

  const totalAssets = useMemo(() => {
    return transformedLoans.reduce((sum, loan) => {
      if (hasValuationMethod(loan.pricing) && loan.pricing.valuationMethod !== 'cash') {
        const amount = new CurrencyBalance(
          getAmount(loan, loan.pool, false, true),
          loan.pool.currency.decimals
        ).toDecimal()
        return sum.add(amount)
      }
      return sum
    }, Dec(0))
  }, [transformedLoans])

  const offchainAssets = useMemo(() => {
    return transformedLoans.filter(
      (loan) => hasValuationMethod(loan.pricing) && loan.pricing.valuationMethod === 'cash'
    )
  }, [transformedLoans])

  const offchainReserve = useMemo(() => {
    return transformedLoans.reduce((sum, loan) => {
      if (hasValuationMethod(loan.pricing) && loan.pricing.valuationMethod === 'cash' && loan.status === 'Active') {
        const amount = new CurrencyBalance(
          getAmount(loan, loan.pool, false, true),
          loan.pool.currency.decimals
        ).toDecimal()
        return sum.add(amount)
      }
      return sum
    }, Dec(0))
  }, [transformedLoans])

  const uniquePools = useMemo(() => {
    const poolMap = new Map<string, TransformedLoan>()
    transformedLoans.forEach((loan) => {
      if (!poolMap.has(loan.pool.id)) {
        poolMap.set(loan.pool.id, loan)
      }
    })
    return Array.from(poolMap.values())
  }, [transformedLoans])

  const onchainReserve = useMemo(() => {
    return uniquePools.reduce((sum, loan) => {
      const navTotal = loan.pool.reserve?.total || '0'
      const navAmount = new CurrencyBalance(navTotal, loan.pool.currency.decimals).toDecimal()
      return sum.add(navAmount)
    }, Dec(0))
  }, [uniquePools])

  const pendingFees = useMemo(() => {
    return uniquePools.reduce((sum, loan) => {
      const feeTotalPending = loan.pool.fees?.totalPending ? loan.pool.fees.totalPending.toDecimal() : 0
      return sum.add(Dec(feeTotalPending))
    }, Dec(0))
  }, [uniquePools])

  const totalNAV = useMemo(() => {
    return uniquePools.reduce((sum, loan) => {
      const navTotal = loan.pool.nav?.total || '0'
      const navAmount = new CurrencyBalance(navTotal, loan.pool.currency.decimals).toDecimal()
      return sum.add(navAmount)
    }, Dec(0))
  }, [uniquePools])

  return {
    totalLoans,
    totalAssets,
    offchainAssets,
    offchainReserve,
    onchainReserve,
    pendingFees,
    totalNAV,
  }
}

export const useTotalNAV = (pools: Pool[]) => {
  return pools.reduce((sum, pool) => {
    const navTotal = pool.nav?.total || '0'
    const navAmount = new CurrencyBalance(navTotal, pool.currency.decimals).toDecimal()
    return sum.add(navAmount)
  }, Dec(0))
}

export function usePoolMetadataMap(pools: Pool[]) {
  const metas = usePoolMetadataMulti(pools)
  const poolMetadataMap = useMemo(() => {
    const map = new Map<string, any>()
    pools.forEach((pool, index) => {
      map.set(pool.id, metas[index]?.data)
    })
    return map
  }, [pools, metas])
  return poolMetadataMap
}

export type PoolWithMetadata = Pool & { meta: PoolMetadata }
export function useGetPoolsMetadata(pools: Pool[]): PoolWithMetadata[] {
  const metas = usePoolMetadataMap(pools)
  return (
    pools?.map((pool) => {
      const meta = metas.get(pool.id)
      return {
        ...pool,
        meta,
      }
    }) || []
  )
}
export function valuesToNftProperties(values: CreateAssetFormValues['attributes'], template: LoanTemplate) {
  return Object.fromEntries(
    template.sections.flatMap((section) =>
      section.attributes
        .map((key) => {
          const attr = template.attributes[key]
          if (!attr.public) return undefined as never
          const value = values[key]
          switch (attr.input.type) {
            case 'date':
              return [key, new Date(value).toISOString()]
            case 'currency': {
              return [
                key,
                attr.input.decimals ? CurrencyBalance.fromFloat(value, attr.input.decimals).toString() : String(value),
              ]
            }
            case 'number':
              return [
                key,
                attr.input.decimals ? CurrencyBalance.fromFloat(value, attr.input.decimals).toString() : String(value),
              ]
            default:
              return [key, String(value)]
          }
        })
        .filter(Boolean)
    )
  )
}

// current nav minus snapshot nav (aggregated) / snapshot nav (aggregated) * 100
export function useNavGrowth(pools: Pool[], period: 'YTD' | '90d' | '180d') {
  const { startDate, endDate } = useMemo(() => {
    const today = new Date()
    const addOneDay = (date: Date): Date => {
      const newDate = new Date(date)
      newDate.setDate(date.getDate() + 1)
      return newDate
    }
    let startDate: Date
    if (period === 'YTD') {
      startDate = new Date(Date.UTC(today.getUTCFullYear() - 1, today.getUTCMonth(), today.getUTCDate(), 0, 0, 0))
    } else if (period === '90d') {
      startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
    } else if (period === '180d') {
      startDate = new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000)
    } else {
      startDate = today
    }
    return { startDate, endDate: addOneDay(startDate) }
  }, [period])

  const poolIds = useMemo(() => pools.map((pool) => pool.id), [pools])

  const { data, isLoading } = useSubquery(
    `query ($start: Datetime!, $end: Datetime!) {
      poolSnapshots(
        filter: { 
          period: { 
            start: { greaterThanOrEqualTo: $start, lessThanOrEqualTo: $end } 
          } 
        }
      ) {
        nodes {
          netAssetValue
           timestamp
          pool {
            id
            currency {
              decimals
            }
          }
        }
      }
    }`,
    { start: startDate, end: endDate },
    { enabled: poolIds.length > 0 }
  )

  // 4. Flatten and filter the snapshot data so that only snapshots for our pools are included.
  const flattenedData: FlattenedDataItem[] = useMemo(() => {
    if (!data?.poolSnapshots?.nodes) return []
    return data.poolSnapshots.nodes
      .filter((snapshot: any) => poolIds.includes(snapshot.pool.id))
      .map((snapshot: any) => ({
        netAssetValue: snapshot.netAssetValue,
        decimals: snapshot.pool.currency.decimals,
        poolId: snapshot.pool.id,
      }))
  }, [data, poolIds])

  // 5. Aggregate the NAV from the snapshot data.
  const aggregatedSnapshotNAV = flattenedData.reduce((accumulator: Decimal, item: FlattenedDataItem) => {
    const nav = new CurrencyBalance(item.netAssetValue, item.decimals)
    return accumulator.add(nav.toDecimal())
  }, Dec(0))

  // 6. Aggregate the current NAV from the provided pools.
  const aggregatedCurrentNAV = pools.reduce((accumulator, pool) => {
    const decimals = pool.currency?.decimals ?? 0
    const navTotal = new CurrencyBalance(pool.nav.total, decimals)
    return accumulator.add(navTotal.toDecimal())
  }, Dec(0))

  // 7. Compute the percentage growth.
  const snapshotNAV = aggregatedSnapshotNAV.toNumber()
  const currentNAV = aggregatedCurrentNAV.toNumber()
  const growth = snapshotNAV ? ((currentNAV - snapshotNAV) / snapshotNAV) * 100 : 0

  return { growth, isLoading }
}

const getTrancheText = (trancheToken: Token) => {
  if (trancheToken.seniority === 0) return 'junior'
  if (trancheToken.seniority === 1) return 'senior'
  return 'mezzanine'
}

export const calculateApyPerToken = (trancheToken: Token, pool: Pool) => {
  const daysSinceCreation = pool?.createdAt ? daysBetween(new Date(pool.createdAt), new Date()) : 0
  if (getTrancheText(trancheToken) === 'senior')
    return formatPercentage(trancheToken?.interestRatePerSec ? trancheToken?.interestRatePerSec.toAprPercent() : Dec(0))
  if (trancheToken.seniority === 0) return '15%'
  if (daysSinceCreation < 30) return 'N/A'
  return trancheToken.yieldSinceInception ? formatPercentage(new Perquintill(trancheToken.yieldSinceInception)) : '-'
}
