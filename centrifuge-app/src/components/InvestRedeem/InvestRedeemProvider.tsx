/*
const balances = {
	tranches: [] as AccountTokenBalance[],
	currencies: [] as AccountCurrencyBalance[],
	native: {
		balance: new CurrencyBalance(
			(nativeBalance as any).data.free.toString(),
			api.registry.chainDecimals[0]
		),
		currency: {
			decimals: api.registry.chainDecimals[0],
			symbol: api.registry.chainTokens[0],
		},
	},
}

order: {
    investCurrency: CurrencyBalance;
    redeemToken: TokenBalance;
    submittedAt: number;
    payoutCurrencyAmount: CurrencyBalance;
    payoutTokenAmount: TokenBalance;
    remainingInvestCurrency: CurrencyBalance;
    remainingRedeemToken: TokenBalance;
}


*/

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
  const Comp = isTinlakePool ? InvestRedeemTinlakeProvider : InvestRedeemCentrifugeProvider

  return <Comp {...props} />
}
