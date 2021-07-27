import { baseToDisplay, toPrecision } from '@centrifuge/tinlake-js'
import * as React from 'react'
import { useSelector } from 'react-redux'
import { PoolState } from '../ducks/pool'
import { PoolsState } from '../ducks/pools'
import { RewardsState } from '../ducks/rewards'

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

export const useYield = () => {
  const pool = useSelector<any, PoolState>((state) => state.pool)
  const pools = useSelector<any, PoolsState>((state) => state.pools)

  const [dropYield, setDropYield] = React.useState('')
  const [tinYield, setTinYield] = React.useState('')

  React.useEffect(() => {
    if (pools.data?.pools && pool.poolId) {
      const poolData = pools.data?.pools.find((singlePool) => singlePool.id === pool.poolId)
      if (poolData?.seniorYield30Days && poolData?.juniorYield30Days) {
        setDropYield(toPrecision(baseToDisplay(poolData.seniorYield30Days.muln(100), 27), 2))
        setTinYield(toPrecision(baseToDisplay(poolData.juniorYield30Days.muln(100), 27), 2))
      }
    }
  }, [pool, pools])

  return { dropYield, tinYield }
}

export const useCFGYield = () => {
  const rewards = useSelector<any, RewardsState>((state: any) => state.rewards)
  const wCFGPrice = useSelector<any, string>((state: any) => state.userRewards.wCFGPrice)

  const [cfgYield, setCFGYield] = React.useState('0')

  React.useEffect(() => {
    if (wCFGPrice && rewards.data?.rewardRate) {
      const DAYS = 365
      const rewardRate = rewards.data.rewardRate.toNumber()

      setCFGYield((DAYS * rewardRate * parseFloat(wCFGPrice) * 100).toString())
    }
  }, [wCFGPrice, rewards.data?.rewardRate])

  return cfgYield
}
