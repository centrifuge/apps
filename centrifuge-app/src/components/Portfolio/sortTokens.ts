import { Pool } from '@centrifuge/centrifuge-js'
import { TinlakePool } from '../../utils/tinlake/useTinlakePools'
import { TokenCardProps } from './TokenListItem'

export const sortTokens = (
  tokens: TokenCardProps[],
  pools: {
    centPools: Pool[]
    tinlakePools: TinlakePool[]
  },
  searchParams: URLSearchParams
) => {
  const sortDirection = searchParams.get('sort')
  const sortBy = searchParams.get('sort-by')

  if (sortBy === 'market-value') {
    tokens.sort((trancheA, trancheB) => {
      const valueA = sortMarketValue(trancheA, pools)
      const valueB = sortMarketValue(trancheB, pools)

      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA
    })
  }

  if (sortBy === 'unrealized-pl') {
    tokens.sort((tokenA, tokenB) => {
      const valueA = sortUnrealizedPL(tokenA, pools)
      const valueB = sortUnrealizedPL(tokenB, pools)

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

  const poolTranche = pool?.tranches.find(({ id }) => id === token.trancheId)

  return poolTranche?.tokenPrice ? token.balance.toDecimal().mul(poolTranche.tokenPrice.toDecimal()).toNumber() : 0
}

const sortUnrealizedPL = (
  token: TokenCardProps,
  pools: {
    centPools: Pool[]
    tinlakePools: TinlakePool[]
  }
) => {
  /* TODO: calculate unrealized p&l */
  const pool = token.poolId.startsWith('0x')
    ? pools.tinlakePools?.find((p) => p.id.toLowerCase() === token.poolId.toLowerCase())
    : pools.centPools?.find((p) => p.id === token.poolId)

  const poolTranche = pool?.tranches.find(({ id }) => id === token.trancheId)

  return poolTranche?.tokenPrice ? poolTranche.tokenPrice.toDecimal().mul(100000).toDecimalPlaces(0).toNumber() : 0
}
