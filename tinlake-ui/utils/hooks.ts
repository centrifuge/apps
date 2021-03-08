import { ITinlake } from '@centrifuge/tinlake-js'
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

export const useOnConnect = (tinlake: ITinlake) => {
  const dispatch = useDispatch()
  const address = useSelector<any, string | null>((state) => state.auth.address)
  const [savedCallback, setCallback] = React.useState(undefined as Function | undefined)

  React.useEffect(() => {
    console.log(address)
    if (savedCallback !== undefined && address !== null) {
      console.log('/')
      savedCallback(address)
      setTimeout(() => {
        setCallback(undefined)
      }, 1)
    }
  }, [savedCallback, address, tinlake])

  return (cb: (address: string) => void) => {
    console.log(address)
    if (address) {
      console.log(1)
      cb(address)
    } else {
      console.log(2)
      setCallback(cb)
      dispatch(ensureAuthed())
    }
  }
}
