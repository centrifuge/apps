import Centrifuge from '@centrifuge/centrifuge-js'
import * as React from 'react'

const CentrifugeContext = React.createContext<Centrifuge>(null as any)

export const CentrifugeProvider: React.FC = ({ children }) => {
  const ctx = React.useMemo(
    () =>
      new Centrifuge({
        network: 'altair',
        altairWsUrl: process.env.REACT_APP_ALTAIR_WSS_URL,
        kusamaWsUrl: process.env.REACT_APP_KUSAMA_WSS_URL,
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
