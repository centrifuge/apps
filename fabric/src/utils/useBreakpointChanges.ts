import * as React from 'react'
import { useTheme } from 'styled-components'
import useEventCallback from './useEventCallback'

export function useBreakpointChanges(onChange: (matchingIndex: number) => void) {
  const { breakpoints } = useTheme()
  const callback = useEventCallback(onChange)

  React.useEffect(() => {
    const mqls = breakpoints.map((bp) => window.matchMedia(`(min-width: ${toPx(bp)})`))

    function handleChange() {
      const index = mqls.findIndex((mql) => !!mql.matches)
      const matchingIndex = index === -1 ? mqls.length : index
      callback(matchingIndex)
    }

    mqls.forEach((mql) => {
      mql.addEventListener('change', handleChange)
    })

    return () => {
      mqls.forEach((mql) => {
        mql.removeEventListener('change', handleChange)
      })
    }
  }, [])
}

function toPx(n: number | string) {
  return typeof n === 'number' ? `${n}px` : n
}
