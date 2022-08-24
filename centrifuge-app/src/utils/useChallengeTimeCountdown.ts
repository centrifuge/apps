import { lastValueFrom } from '@polkadot/api-base/node_modules/rxjs'
import React from 'react'
import { useCentrifuge } from '../components/CentrifugeProvider'
import { useBlock } from './useBlock'
import { usePool } from './usePools'

export const useChallengeTimeCountdown = (poolId: string) => {
  const pool = usePool(poolId)
  const cent = useCentrifuge()
  const { block } = useBlock()
  const [minutesRemaining, setMinutesRemaining] = React.useState(0)

  React.useEffect(() => {
    if (!pool) return
    async function asyncCallback() {
      const blockNumber = block?.header.number.toNumber()
      if (pool?.epoch.challengePeriodEnd && blockNumber) {
        const blocksRemaining = pool.epoch.challengePeriodEnd - blockNumber
        if (blocksRemaining > 0) {
          const avgTimePerBlock = await lastValueFrom(cent.utils.getAvgTimePerBlock())

          setMinutesRemaining(Math.ceil((blocksRemaining * avgTimePerBlock) / 60000))
        }
        setMinutesRemaining(0)
      }
    }
    asyncCallback()
  }, [block])

  return { minutes: minutesRemaining }
}
