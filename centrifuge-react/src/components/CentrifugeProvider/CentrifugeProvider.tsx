import Centrifuge from '@centrifuge/centrifuge-js'
import type { UserProvidedConfig } from '@centrifuge/centrifuge-js/dist/CentrifugeBase'
import * as React from 'react'

const CentrifugeContext = React.createContext<{ centrifuge: Centrifuge; key: string }>(null as any)

export type CentrifugeProviderProps = {
  children: React.ReactNode
  config?: UserProvidedConfig
}

export function CentrifugeProvider({ children, config }: CentrifugeProviderProps) {
  const ctx = React.useMemo(() => ({ centrifuge: new Centrifuge(config), key: JSON.stringify(config) }), [config])

  return <CentrifugeContext.Provider value={ctx}>{children}</CentrifugeContext.Provider>
}

export function useCentrifuge() {
  const ctx = React.useContext(CentrifugeContext)
  if (!ctx) throw new Error('useCentrifuge must be used within Provider')
  return ctx.centrifuge
}

export function useCentrifugeKey() {
  const ctx = React.useContext(CentrifugeContext)
  if (!ctx) throw new Error('useCentrifugeKey must be used within Provider')
  return ctx.key
}
