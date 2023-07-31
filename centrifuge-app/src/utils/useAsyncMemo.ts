// @Onno: I'm doubting to install the package or copy. WDYT?
// source
// https://github.com/awmleer/use-async-memo/blob/master/src/index.ts

import * as React from 'react'

export function useAsyncMemo<T>(factory: () => Promise<T> | undefined | null, deps: React.DependencyList): T | undefined
export function useAsyncMemo<T>(factory: () => Promise<T> | undefined | null, deps: React.DependencyList, initial: T): T
export function useAsyncMemo<T>(factory: () => Promise<T> | undefined | null, deps: React.DependencyList, initial?: T) {
  const [val, setVal] = React.useState<T | undefined>(initial)

  React.useEffect(() => {
    let cancel = false
    const promise = factory()

    if (promise === undefined || promise === null) {
      return
    }

    promise.then((result) => {
      if (!cancel) {
        setVal(result)
      }
    })

    return () => {
      cancel = true
    }
  }, deps)

  return val
}
