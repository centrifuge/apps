import { baseToDisplay, ITinlake, toPrecision } from '@centrifuge/tinlake-js'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getWCFGPrice } from '../ducks/userRewards'
import { useGlobalRewards } from './useGlobalRewards'
import { usePools } from './usePools'

// Source: https://www.30secondsofcode.org/react/s/use-interval
export const useInterval = (callback: any, delay: number) => {
  const savedCallback = React.useRef()

  React.useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  React.useEffect(() => {
    function tick() {
      if (savedCallback.current) (savedCallback as any).current()
    }
    if (delay !== null) {
      const id = setInterval(tick, delay)
      return () => clearInterval(id)
    }
  }, [delay])
}

export const useTrancheYield = (poolId?: string | undefined) => {
  const pools = usePools()

  return React.useMemo(() => {
    if (pools.data?.pools && poolId) {
      const poolData = pools.data.pools.find((singlePool) => singlePool.id === poolId)
      if (poolData?.seniorYield30Days && poolData?.juniorYield30Days) {
        return {
          dropYield: toPrecision(baseToDisplay(poolData.seniorYield30Days.muln(100), 27), 2),
          tinYield: toPrecision(baseToDisplay(poolData.juniorYield30Days.muln(100), 27), 2),
        }
      }
    }

    return {
      dropYield: '',
      tinYield: '',
    }
  }, [poolId, pools])
}

export const useCFGYield = (tinlake: ITinlake) => {
  const rewards = useGlobalRewards()
  const wCFGPrice = useSelector<any, number>((state: any) => state.userRewards.wCFGPrice)

  const dispatch = useDispatch()

  React.useEffect(() => {
    if (tinlake) {
      dispatch(getWCFGPrice(tinlake))
    }
  }, [tinlake])

  return React.useMemo(() => {
    if (wCFGPrice && rewards.data?.rewardRate) {
      const DAYS = 365
      const rewardRate = rewards.data.rewardRate.toNumber()

      return (DAYS * rewardRate * wCFGPrice * 100).toString()
    }

    return '0'
  }, [wCFGPrice, rewards.data?.rewardRate])
}
