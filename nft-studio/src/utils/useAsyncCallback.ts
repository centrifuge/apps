import * as React from 'react'

type State = 'initial' | 'loading' | 'success' | 'error'

export function useAsyncCallback<T extends any[], R = unknown>(callback: (...args: T) => Promise<R>) {
  const [state, setState] = React.useState<State>('initial')
  const [response, setResponse] = React.useState<R | undefined>()
  const inFlight = React.useRef<Promise<R> | undefined>()

  async function execute(...args: T): Promise<R> {
    setState('loading')
    const thenable = callback(...args)
    inFlight.current = thenable

    try {
      const res = await thenable
      if (thenable === inFlight.current) {
        setResponse(res)
        setState('success')
        inFlight.current = undefined
      }
      return res
    } catch (e) {
      if (thenable === inFlight.current) {
        setState('error')
        inFlight.current = undefined
      }
      throw e
    }
  }

  function reset() {
    inFlight.current = undefined
    setResponse(undefined)
    setState('initial')
  }

  return {
    response,
    isLoading: state === 'loading',
    isError: state === 'error',
    isSuccess: state === 'success',
    execute,
    reset,
  }
}
