import { useCallback, useLayoutEffect, useRef } from 'react'

type Calback = (...args: any[]) => any

export function useEventCallback<T extends Calback>(callback: T) {
  const ref = useRef<T>((() => {
    throw new Error('Cannot call an event handler while rendering.')
  }) as any)

  useLayoutEffect(() => {
    ref.current = callback
  })

  return useCallback((...args: Parameters<T>) => {
    const fn = ref.current
    return fn(...args)
  }, [])
}
