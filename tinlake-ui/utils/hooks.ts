import { baseToDisplay, ITinlake, toPrecision } from '@centrifuge/tinlake-js'
import { Decimal } from 'decimal.js-light'
import { ethers } from 'ethers'
import * as React from 'react'
import { useQuery } from 'react-query'
import { useTinlake } from '../components/TinlakeProvider'
import { useGlobalRewards } from './useGlobalRewards'
import { usePools } from './usePools'

// Source: https://www.30secondsofcode.org/react/s/use-interval
export const useInterval = (callback: any, delay?: number | null) => {
  const savedCallback = React.useRef()

  React.useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  React.useEffect(() => {
    function tick() {
      if (savedCallback.current) (savedCallback as any).current()
    }
    if (delay != null) {
      const id = setInterval(tick, delay)
      return () => clearInterval(id)
    }
  }, [delay])
}

type TrancheYield = {
  dropYield: string
  tinYield: string
}

export const useTrancheYield = (poolId?: string | undefined): TrancheYield => {
  const pools = usePools()

  return React.useMemo(() => {
    if (pools.data?.pools && poolId) {
      const poolData = pools.data.pools.find((singlePool) => singlePool.id.toLowerCase() === poolId.toLowerCase())
      return {
        dropYield: poolData?.seniorYield30Days
          ? toPrecision(baseToDisplay(poolData.seniorYield30Days.muln(100), 27), 2)
          : '',
        tinYield: poolData?.juniorYield90Days
          ? toPrecision(baseToDisplay(poolData.juniorYield90Days.muln(100), 27), 2)
          : '',
      }
    }

    return {
      dropYield: '',
      tinYield: '',
    }
  }, [poolId, pools])
}

export const useCFGYield = () => {
  const rewards = useGlobalRewards()
  const tinlake = useTinlake()
  const { data: wCFGPrice } = useQuery('wCFGPrice', () => getWCFGPrice(tinlake))

  return React.useMemo(() => {
    if (wCFGPrice && rewards.data?.dropRewardRate) {
      const DAYS = 365
      const rewardRate = rewards.data.dropRewardRate.toNumber()

      return (DAYS * rewardRate * wCFGPrice * 100).toString()
    }

    return null
  }, [wCFGPrice, rewards.data?.dropRewardRate])
}

async function getWCFGPrice(tinlake: ITinlake) {
  const usdcWcfgPool = '0x7270233cCAE676e776a659AFfc35219e6FCfbB10'
  const uniswapPoolAbi = ['function observe(uint32[] secondsAgos) external view returns (int56[], uint160[])']

  const poolContract = new ethers.Contract(usdcWcfgPool, uniswapPoolAbi, tinlake.provider)
  const observations = (await poolContract.observe([0, 1]))[0]
  const first = new Decimal(observations[0].toString())
  const second = new Decimal(observations[1].toString())
  const price = new Decimal(1.0001).toPower(second.sub(first)).times(new Decimal(10).toPower(12)).toNumber()
  return price
}
