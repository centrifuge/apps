import { useWallet } from '@centrifuge/centrifuge-react'
import * as React from 'react'
import { InvestRedeemCentrifugeProvider } from './InvestRedeemCentrifugeProvider'
import { InvestRedeemLiquidityPoolsProvider } from './InvestRedeemLiquidityPoolsProvider'
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
  const { connectedType, isEvmOnSubstrate } = useWallet()
  const Comp = isTinlakePool
    ? InvestRedeemTinlakeProvider
    : connectedType === 'evm' && !isEvmOnSubstrate
    ? InvestRedeemLiquidityPoolsProvider
    : InvestRedeemCentrifugeProvider

  return <Comp {...props} />
}
