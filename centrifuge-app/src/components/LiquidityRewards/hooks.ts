import { useCentrifugeQuery } from '@centrifuge/centrifuge-react'

export function useAccountStakes(address?: string, poolId?: string, trancheId?: string) {
  const [result] = useCentrifugeQuery(
    ['stakes', address, poolId, trancheId],
    (cent) => cent.rewards.getAccountStakes([address!, poolId!, trancheId!]),
    {
      suspense: true,
      enabled: !!address && !!poolId && !!trancheId,
    }
  )

  return result
}

export function useOrmlTokens(address?: string, poolId?: string, trancheId?: string) {
  const [result] = useCentrifugeQuery(
    ['orml tokens', address, poolId, trancheId],
    (cent) => cent.rewards.getORMLTokens([address!, poolId!, trancheId!]),
    {
      enabled: !!address && !!poolId && !!trancheId,
    }
  )

  return result
}

export function useActiveEpochData() {
  const [result] = useCentrifugeQuery(['Liquidity Rewards Active Epoch Data'], (cent) =>
    cent.rewards.getActiveEpochData()
  )

  return result
}

export function useRewardCurrencyGroup(poolId?: string, trancheId?: string) {
  const [result] = useCentrifugeQuery(
    ['reward currency group', poolId, trancheId],
    (cent) => cent.rewards.getRewardCurrencyGroup([poolId!, trancheId!]),
    {
      enabled: !!poolId && !!trancheId,
    }
  )

  return result
}

export function useComputeLiquidityRewards(address?: string, poolId?: string, trancheId?: string) {
  const [result] = useCentrifugeQuery(
    ['compute liquidity rewards', address, poolId, trancheId],
    (cent) => cent.rewards.computeReward([address!, poolId!, trancheId!, 'Liquidity']),
    {
      enabled: !!address && !!poolId && !!trancheId,
    }
  )

  return result
}

// list of all staked currencyIds
export function useListCurrencies(address?: string) {
  const [result] = useCentrifugeQuery(
    ['list currencies', address],
    (cent) => cent.rewards.listCurrencies([address!, 'Liquidity']),
    {
      enabled: !!address,
    }
  )

  return result
}
