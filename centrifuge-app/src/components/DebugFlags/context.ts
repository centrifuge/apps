import * as React from 'react'
import { debug, flagsConfig, Key } from './config'

export type Flags = {
  [T in Key]: (typeof flagsConfig)[T] extends { options: { [key: string]: infer Y } }
    ? Y
    : (typeof flagsConfig)[T]['default']
}
export type FlagsState = {
  [T in Key]: (typeof flagsConfig)[T]['default']
}

interface Context {
  flags: Flags
  register: (id: number, keys: string[]) => void
  unregister: (id: number) => void
}

export const defaultFlags: Flags = Object.entries(flagsConfig).reduce((obj, [k, v]) => {
  obj[k] = 'options' in v ? v.options[v.default as string] : v.default
  return obj
}, {} as any)

let persistedState: FlagsState | null = null
try {
  const stored = localStorage.getItem('debugFlags') ?? ''
  persistedState = JSON.parse(stored[0] === '{' ? stored : '') as FlagsState
} catch (e) {
  //
}
const flagKeys = Object.keys(flagsConfig)
export const initialFlagsState: FlagsState = persistedState
  ? Object.entries(persistedState)
      .filter(([k]) => flagKeys.includes(k))
      .reduce((obj, [k, v]) => {
        obj[k] = v
        return obj
      }, {} as any)
  : Object.entries(flagsConfig).reduce((obj, [k, v]) => {
      obj[k] = v.default
      return obj
    }, {} as any)

export const DebugFlagsContext = React.createContext<Context>({ flags: defaultFlags, register() {}, unregister() {} })

let i = 0

/**
 * On render the Proxy in this hook tracks which properties are being accessed.
 * After mounting, it registers these properties with the DebugFlags provider,
 * so the provider knows which flags are being used on the page and can enable those in the debug panel
 */
export function useDebugFlags(): Flags {
  const [id] = React.useState(() => (i += 1))
  const ctx = React.useContext(DebugFlagsContext)
  const tracked = React.useRef<any>({})
  const stateRef = React.useRef(ctx.flags)
  stateRef.current = ctx.flags

  const proxiedFlags = React.useMemo(
    () =>
      new Proxy(ctx.flags, {
        get(_, prop: Key) {
          tracked.current[prop] = true
          return stateRef.current[prop]
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  React.useEffect(() => {
    ctx.register(id, Object.keys(tracked.current))

    return () => ctx.unregister(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return debug ? proxiedFlags : ctx.flags
}
