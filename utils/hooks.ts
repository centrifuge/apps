import * as React from 'react'

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
