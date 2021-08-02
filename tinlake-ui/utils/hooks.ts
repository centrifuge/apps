import * as React from 'react'
import { useSelector } from 'react-redux'
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

export const useCFGYield = () => {
  const rewards = useSelector<any, RewardsState>((state: any) => state.rewards)
  const wCFGPrice = useSelector<any, number>((state: any) => state.userRewards.wCFGPrice)

  const [cfgYield, setCFGYield] = React.useState('0')

  React.useEffect(() => {
    if (wCFGPrice && rewards.data?.rewardRate) {
      const DAYS = 365
      const rewardRate = rewards.data.rewardRate.toNumber()

      setCFGYield((DAYS * rewardRate * wCFGPrice * 100).toString())
    }
  }, [wCFGPrice, rewards.data?.rewardRate])

  return cfgYield
}
