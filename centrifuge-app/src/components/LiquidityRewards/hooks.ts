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
  const [result] = useCentrifugeQuery(['System current block'], (cent) => cent.utils.getCurrentBlock())

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
export function useStakedCurrencyIds(address?: string) {
  const [result] = useCentrifugeQuery(
    ['list currencies', address],
    (cent) => cent.rewards.listCurrencies([address!, 'Liquidity']),
    {
      enabled: !!address,
    }
  )

  return result
}

export function useClaimCountdown(unixTimestamp?: number | null): ClaimCountDown {
  if (!unixTimestamp) {
    return null
  }

  const timeRemaining = unixTimestamp - new Date().getTime()

  if (timeRemaining <= 0) {
    return null
  }

  const millisecondsInDay = 24 * 60 * 60 * 1000
  const millisecondsInHour = 60 * 60 * 1000
  const millisecondsInMinute = 60 * 1000
  const millisecondsInSecond = 1000

  const days = Math.floor(timeRemaining / millisecondsInDay)
  const hours = Math.floor((timeRemaining % millisecondsInDay) / millisecondsInHour)
  const minutes = Math.floor((timeRemaining % millisecondsInHour) / millisecondsInMinute)
  const seconds = Math.floor((timeRemaining % millisecondsInMinute) / millisecondsInSecond)

  if (hours + minutes + seconds <= 0) {
    return null
  }

  const daysMessage = days >= 1 ? `${days} day${days === 1 ? '' : 's'}` : ''
  const hoursMessage = hours > 0 ? `${hours} hr${hours <= 1 ? '' : 's'}` : ''
  const minutesMessage = minutes > 0 ? `${minutes} min${minutes <= 1 ? '' : 's'}` : ''
  const secondsMessage = seconds > 0 ? `${seconds} second${seconds <= 1 ? '' : 's'}` : ''

  return days >= 1 ? daysMessage : [hoursMessage, minutesMessage, secondsMessage].filter(Boolean).join(' ')
}
