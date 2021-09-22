import * as React from 'react'
import { debug, flagsConfig } from './config'

export type Key = keyof typeof flagsConfig
export type Flags = { [key in Key]: any }

interface Context {
  flags: Flags
  register: (id: number, keys: string[]) => void
  unregister: (id: number) => void
}

export const defaultFlags = Object.entries(flagsConfig).reduce((obj, [k, v]) => {
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
export function useDebugFlags() {
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
    []
  )

  React.useEffect(() => {
    ctx.register(id, Object.keys(tracked.current))

    return () => ctx.unregister(id)
  }, [])

  return debug ? proxiedFlags : ctx.flags
}
