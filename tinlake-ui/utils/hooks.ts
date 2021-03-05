import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ensureAuthed } from '../ducks/auth'

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

export const useOnConnect = () => {
  const dispatch = useDispatch()
  const address = useSelector<any, string | null>((state) => state.auth.address)
  const [callback, setCallback] = React.useState(undefined as Function | undefined)

  React.useEffect(() => {
    if (callback !== undefined) {
      callback(address)
      setCallback(undefined)
    }
  }, [address])

  return (cb: (address: string) => void) => {
    if (address) {
      cb(address)
    }

    setCallback(cb)
    dispatch(ensureAuthed())
  }
}
