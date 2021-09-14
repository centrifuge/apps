import * as React from 'react'
import { useTheme } from 'styled-components'

type Breakpoint = 'small' | 'medium' | 'large' | 'xlarge'

type Options = string | { below: Breakpoint } | { above: Breakpoint }

let serverHandoffComplete = false

export function useMedia(options: Options) {
  const theme = useTheme()
  const query =
    typeof options === 'string'
      ? options
      : 'above' in options
      ? `(min-width: ${theme.breakpoints[options.above]})`
      : `(max-width: ${theme.breakpoints[options.below]})`
  const [state, setState] = React.useState(() => (serverHandoffComplete ? window.matchMedia(query).matches : null))

  React.useEffect(() => {
    let mounted = true
    serverHandoffComplete = true

    const mql = window.matchMedia(query)
    const onChange = () => {
      if (!mounted) {
        return
      }
      setState(mql.matches)
    }

    mql.addEventListener('change', onChange)

    if (state === null) {
      setState(mql.matches)
    }

    return () => {
      mounted = false
      mql.removeEventListener('change', onChange)
    }
  }, [])

  return state
}
