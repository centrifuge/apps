import Centrifuge from '@centrifuge/centrifuge-js'
import * as React from 'react'

const CentrifugeContext = React.createContext<Centrifuge>(null as any)

const { REACT_APP_RELAY_WSS_URL, REACT_APP_COLLATOR_WSS_URL } = process.env

export const CentrifugeProvider: React.FC = ({ children }) => {
  const ctx = React.useMemo(
    () =>
      new Centrifuge({
        network: 'centrifuge',
        polkadotWsUrl: REACT_APP_RELAY_WSS_URL,
        centrifugeWsUrl: REACT_APP_COLLATOR_WSS_URL,
        printExtrinsics: process.env.NODE_ENV === 'development',
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
