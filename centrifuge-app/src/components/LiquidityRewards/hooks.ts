import { useCentrifugeQuery } from '@centrifuge/centrifuge-react'
import { ClaimCountDown } from './types'

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

export function useEndOfEpoch() {
  const [result] = useCentrifugeQuery(['Liquidity Rewards End of Epoch'], (cent) => cent.rewards.getEndOfEpoch())

  return result
}

export function useCurrentBlock() {
  const [result] = useCentrifugeQuery(['System current block'], (cent) => cent.rewards.getCurrentBlock())

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

export function useClaimCountdown(remainingBlocks: number): ClaimCountDown {
  const defaultReturn = null

  if (typeof remainingBlocks !== 'number' || isNaN(remainingBlocks)) {
    return defaultReturn
  }

  const executionTimePerBlockInSeconds = 12
  const secondsInADay = 24 * 60 * 60
  const totalSeconds = remainingBlocks * executionTimePerBlockInSeconds
  const remainingSeconds = totalSeconds % secondsInADay

  const days = Math.floor(totalSeconds / secondsInADay)
  const hours = Math.floor(remainingSeconds / 3600)
  const minutes = Math.floor((remainingSeconds % 3600) / 60)
  const seconds = remainingSeconds % 60

  if (hours + minutes + seconds <= 0) {
    return defaultReturn
  }

  const daysMessage = days >= 1 ? `${days} day${days === 1 ? '' : 's'}` : ''
  const hoursMessage = hours > 0 ? `${hours} hr${hours <= 1 ? '' : 's'}` : ''
  const minutesMessage = minutes > 0 ? `${minutes} min${minutes <= 1 ? '' : 's'}` : ''
  const secondsMessage = seconds > 0 ? `${seconds} second${seconds <= 1 ? '' : 's'}` : ''

  return days >= 1 ? daysMessage : [hoursMessage, minutesMessage, secondsMessage].filter(Boolean).join(' ')
}
