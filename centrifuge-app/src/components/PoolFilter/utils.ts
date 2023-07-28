import { PoolCardProps } from '../../pages/Pools'
import { poolFilterConfig, SEARCH_KEYS } from './config'
import { SortBy, SortDirection } from './types'

export function toKebabCase(string: string) {
  return string.toLowerCase().split(' ').join('-')
}

export function filterPools(pools: PoolCardProps[], searchParams: URLSearchParams) {
  let filtered = pools
  const assetClasses = searchParams.getAll(poolFilterConfig.assetClass.searchKey)
  const poolStatuses = searchParams.getAll(poolFilterConfig.poolStatus.searchKey)
  const sortDirection = searchParams.get('sort') as SortDirection
  const sortBy = searchParams.get('sort-by') as SortBy

  if (assetClasses.length) {
    filtered = filtered.filter((pool) => assetClasses.includes(toKebabCase(pool.assetClass)))
  }

  if (poolStatuses.length) {
    filtered = filtered.filter((pool) => poolStatuses.includes(toKebabCase(pool.status)))
  }

  if (sortDirection && sortBy) {
    filtered = sortData(filtered, sortBy, sortDirection)
  }

  return filtered
}

const sortMap = {
  [SEARCH_KEYS.VALUE_LOCKED]: (item: PoolCardProps) => item.valueLocked.toNumber(),
  [SEARCH_KEYS.APR]: (item: PoolCardProps) => (item.apr ? item.apr.toDecimal().toNumber() : 0),
}

function sortData(data: PoolCardProps[], sortBy: SortBy, sortDirection: SortDirection) {
  if (sortMap.hasOwnProperty(sortBy)) {
    const sortFunction = sortMap[sortBy]

    data.sort((a, b) => {
      const valueA = sortFunction(a)
      const valueB = sortFunction(b)

      return sortDirection === 'asc' ? compareNumeric(valueA, valueB) : compareNumeric(valueB, valueA)
    })
  }

  return data
}

function compareNumeric(a: number, b: number) {
  return a - b
}
