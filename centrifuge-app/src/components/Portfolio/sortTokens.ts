import { Pool } from '@centrifuge/centrifuge-js'
import { TinlakePool } from '../../utils/tinlake/useTinlakePools'
import { TokenCardProps } from './TokenListItem'

export const sortTokens = (
  tranches: TokenCardProps[],
  pools: {
    centPools: Pool[]
    tinlakePools: TinlakePool[]
  },
  searchParams: URLSearchParams
) => {
  const sortDirection = searchParams.get('sort')
  const sortBy = searchParams.get('sort-by')

  if (sortBy === 'market-value') {
    tranches.sort((trancheA, trancheB) => {
      const valueA = sortMarketValue(trancheA, pools)
      const valueB = sortMarketValue(trancheB, pools)

      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA
    })
  }

  if (sortBy === 'position' || (!sortDirection && !sortBy)) {
    tranches.sort(({ balance: balanceA }, { balance: balanceB }) =>
      sortDirection === 'asc'
        ? balanceA.toDecimal().toNumber() - balanceB.toDecimal().toNumber()
        : balanceB.toDecimal().toNumber() - balanceA.toDecimal().toNumber()
    )
  }

  return tranches
}

const sortMarketValue = (
  tranche: TokenCardProps,
  pools: {
    centPools: Pool[]
    tinlakePools: TinlakePool[]
  }
) => {
  const pool = tranche.poolId.startsWith('0x')
    ? pools.tinlakePools?.find((p) => p.id.toLowerCase() === tranche.poolId.toLowerCase())
    : pools.centPools?.find((p) => p.id === tranche.poolId)

  const poolTranche = pool?.tranches.find(({ id }) => id === tranche.trancheId)

  return poolTranche?.tokenPrice ? tranche.balance.toDecimal().mul(poolTranche.tokenPrice.toDecimal()).toNumber() : 0
}
