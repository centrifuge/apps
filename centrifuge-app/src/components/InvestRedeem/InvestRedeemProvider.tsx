import { useWallet } from '@centrifuge/centrifuge-react'
import * as React from 'react'
import { InvestRedeemCentrifugeProvider } from './InvestRedeemCentrifugeProvider'
import { InvestRedeemTinlakeProvider } from './InvestRedeemTinlakeProvider'
import { InvestRedeemContext as InvestRedeemContextType, InvestRedeemProviderProps as Props } from './types'

export const InvestRedeemContext = React.createContext<InvestRedeemContextType>({} as any)

export function useInvestRedeem() {
  const ctx = React.useContext(InvestRedeemContext)
  if (!ctx) throw new Error('useInvestRedeem must be used within InvestRedeemProvider')
  return ctx
}

export function InvestRedeemProvider(props: Props) {
  const isTinlakePool = props.poolId.startsWith('0x')
  const { connectedNetwork } = useWallet()
  if (connectedNetwork && [1, 5, 8453, 84531].includes(connectedNetwork as any)) {
    return null
  }

  const Comp = isTinlakePool ? InvestRedeemTinlakeProvider : InvestRedeemCentrifugeProvider

  return <Comp {...props} />
}
