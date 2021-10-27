import { ThemeBreakpoints } from '@centrifuge/fabric/dist/theme'
import * as React from 'react'
import { useTheme } from 'styled-components'

type Breakpoint = string | keyof ThemeBreakpoints

export function useIsAboveBreakpoint(bp: Breakpoint) {
  const theme = useTheme()
  // @ts-ignore
  const query = `(min-width: ${theme.breakpoints[bp] || bp})`
  const [state, setState] = React.useState(() => window.matchMedia(query).matches)

  React.useEffect(() => {
    let mounted = true

    const mql = window.matchMedia(query)
    const onChange = () => {
      if (!mounted) {
        return
      }
      setState(mql.matches)
    }

    mql.addEventListener('change', onChange)

    return () => {
      mounted = false
      mql.removeEventListener('change', onChange)
    }
  }, [query])

  return state
}
