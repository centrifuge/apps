import { Pool } from '@centrifuge/centrifuge-js'
import { TinlakePool } from '../../utils/tinlake/useTinlakePools'
import { SortOptions } from './InvestedTokens'
import { TokenCardProps } from './TokenListItem'

export const sortTokens = (
  tokens: TokenCardProps[],
  pools: {
    centPools: Pool[]
    tinlakePools: TinlakePool[]
  },
  sortOptions: SortOptions
) => {
  const { sortBy, sortDirection } = sortOptions
  if (sortBy === 'market-value') {
    tokens.sort((trancheA, trancheB) => {
      const valueA = sortMarketValue(trancheA, pools)
      const valueB = sortMarketValue(trancheB, pools)

      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA
    })
  }

  if (sortBy === 'position' || (!sortDirection && !sortBy)) {
    tokens.sort(({ balance: balanceA }, { balance: balanceB }) =>
      sortDirection === 'asc'
        ? balanceA.toDecimal().toNumber() - balanceB.toDecimal().toNumber()
        : balanceB.toDecimal().toNumber() - balanceA.toDecimal().toNumber()
    )
  }

  return tokens
}

const sortMarketValue = (
  token: TokenCardProps,
  pools: {
    centPools: Pool[]
    tinlakePools: TinlakePool[]
  }
) => {
  const pool = token.poolId.startsWith('0x')
    ? pools.tinlakePools?.find((p) => p.id.toLowerCase() === token.poolId.toLowerCase())
    : pools.centPools?.find((p) => p.id === token.poolId)

  // @ts-expect-error known typescript issue: https://github.com/microsoft/TypeScript/issues/44373
  const poolTranche = pool?.tranches.find(({ id }) => id === token.trancheId)

  return poolTranche?.tokenPrice ? token.balance.toDecimal().mul(poolTranche.tokenPrice.toDecimal()).toNumber() : 0
}
