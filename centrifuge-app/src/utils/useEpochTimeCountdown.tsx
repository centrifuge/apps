import * as React from 'react'
import { formatMilliseconds } from './date'
import { usePool } from './usePools'

export const useEpochTimeCountdown = (poolId: string) => {
  const pool = usePool(poolId)
  const [{ hours, minutes, seconds }, setTimeRemaining] = React.useState({ hours: 0, minutes: 0, seconds: 0 })

  React.useEffect(() => {
    if (!pool) return
    const start = new Date(pool.epoch.lastClosed).getTime()
    const duration = pool.parameters.minEpochTime * 1000
    const difference = start + duration - Date.now()
    if (difference >= 0) {
      const interval = setInterval(() => {
        const newDifference = start + duration - Date.now()
        if (newDifference <= 0) {
          return clearInterval()
        }
        setTimeRemaining(formatMilliseconds(newDifference))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [pool])

  if (hours + minutes + seconds <= 0) {
    return { hours: null, minutes: null, seconds: null, message: null }
  }
  const hoursMessage = hours > 0 ? `${hours} hrs` : ''
  const minutesMessage = minutes > 0 ? `${minutes} min` : ''
  const secondsMessage = minutes < 5 && seconds > 0 ? `${seconds} seconds` : ''

  return { hours, minutes, seconds, message: `${hoursMessage} ${minutesMessage} ${secondsMessage} remaining` }
}
