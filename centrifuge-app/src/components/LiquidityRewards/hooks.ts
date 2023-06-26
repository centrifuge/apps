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
  const defaultReturn = { days: null, hours: null, minutes: null, seconds: null, message: null }

  if (typeof remainingBlocks !== 'number' || isNaN(remainingBlocks)) {
    return defaultReturn
  }

  const executionTimePerBlockInSeconds = 12
  const secondsInADay = 24 * 60 * 60
  const totalSeconds = remainingBlocks * executionTimePerBlockInSeconds

  const days = Math.floor(totalSeconds / secondsInADay)
  const remainingSeconds = totalSeconds % secondsInADay
  const hours = Math.floor(remainingSeconds / 3600)
  const minutes = Math.floor((remainingSeconds % 3600) / 60)
  const seconds = remainingSeconds % 60

  if (hours + minutes + seconds <= 0) {
    return defaultReturn
  }

  const hoursMessage = hours > 0 ? `${hours} hrs` : ''
  const minutesMessage = minutes > 0 ? `${minutes} min` : ''
  const secondsMessage = minutes < 5 && seconds > 0 ? `${seconds} seconds` : ''

  return {
    days,
    hours,
    minutes,
    seconds,
    message: `${hoursMessage} ${minutesMessage} ${secondsMessage} remaining`,
  }
}
