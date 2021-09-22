import * as React from 'react'
import { debug, flagsConfig } from './config'

export type Key = keyof typeof flagsConfig
export type Flags = { [key in Key]: any }

export interface Context {
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

export function useDebugFlags() {
  const [id] = React.useState(() => ++i)
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
