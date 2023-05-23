import { useEffect, useRef } from 'react'

export function useUpdateEffect(effect: (didUpdate: boolean) => void, dependencies: ReadonlyArray<unknown>) {
  const didMount = useRef(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => effect(didMount.current), dependencies)

  useEffect(() => {
    didMount.current = true
  }, [])
}
