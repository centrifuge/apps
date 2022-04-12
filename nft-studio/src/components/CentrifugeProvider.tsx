import Centrifuge from '@centrifuge/centrifuge-js'
import * as React from 'react'

const CentrifugeContext = React.createContext<Centrifuge>(null as any)

const { VITE_RELAY_WSS_URL, VITE_COLLATOR_WSS_URL } = import.meta.env

export const CentrifugeProvider: React.FC = ({ children }) => {
  const ctx = React.useMemo(
    () =>
      new Centrifuge({
        network: 'centrifuge',
        polkadotWsUrl: VITE_RELAY_WSS_URL as string,
        centrifugeWsUrl: VITE_COLLATOR_WSS_URL as string,
        printExtrinsics: import.meta.env.NODE_ENV === 'development',
      }),
    []
  )

  return <CentrifugeContext.Provider value={ctx}>{children}</CentrifugeContext.Provider>
}

export function useCentrifuge() {
  const ctx = React.useContext(CentrifugeContext)
  if (!ctx) throw new Error('useCentrifuge must be used within CentrifugeProvider')
  return ctx
}
