import { CurrencyMetadata } from '@centrifuge/centrifuge-js'
import { Transaction } from '@centrifuge/centrifuge-react'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import * as React from 'react'

type CurrencyMeta = Pick<CurrencyMetadata, 'decimals' | 'symbol' | 'displayName'>
type NativeCurrencyMeta = Pick<CurrencyMetadata, 'decimals' | 'symbol'>

export type InvestRedeemAction =
  | 'invest'
  | 'redeem'
  | 'collect'
  | 'approvePoolCurrency'
  | 'approveTrancheToken'
  | 'cancelInvest'
  | 'cancelRedeem'
  | 'preAction'

export type InvestRedeemState = {
  poolId: string
  trancheId: string
  isDataLoading: boolean
  isAllowedToInvest?: boolean
  isPoolBusy: boolean
  isFirstInvestment: boolean
  nativeCurrency?: NativeCurrencyMeta
  poolCurrency?: CurrencyMeta
  trancheCurrency?: CurrencyMetadata
  capacity: Decimal
  minInitialInvestment: Decimal
  minOrder: Decimal
  nativeBalance: Decimal
  poolCurrencies: { symbol: string; displayName: string }[]
  poolCurrencyBalance: Decimal
  poolCurrencyBalanceWithPending: Decimal
  trancheBalance: Decimal
  trancheBalanceWithPending: Decimal
  investmentValue: Decimal
  tokenPrice: Decimal
  order?: {
    investCurrency: Decimal
    redeemToken: Decimal
    payoutCurrencyAmount: Decimal
    payoutTokenAmount: Decimal
    investClaimableCurrencyAmount: Decimal
    redeemClaimableTokenAmount: Decimal
    remainingInvestCurrency: Decimal
    remainingRedeemToken: Decimal
  } | null
  collectAmount: Decimal
  collectType: 'invest' | 'redeem' | 'cancelInvest' | 'cancelRedeem' | null
  needsToCollectBeforeOrder: boolean
  needsPoolCurrencyApproval: (amount: number) => boolean
  needsTrancheTokenApproval: (amount: number) => boolean
  needsPreAction: (action: InvestRedeemAction) => string
  canChangeOrder: boolean
  canCancelOrder: boolean
  pendingAction?: InvestRedeemAction | null
  pendingTransaction?: Transaction | null
  statusMessage?: string
  actingAddress?: string
}

export type ActionOptions = {
  onError?: (error: Error) => void
  onSuccess?: (args: any[]) => void
}

export type InvestRedeemActions = {
  invest(newOrder: BN): void
  redeem(newOrder: BN): void
  collect(): void
  approvePoolCurrency(amount: BN): void
  approveTrancheToken(amount: BN): void
  preAction(action: InvestRedeemAction): void
  cancelInvest(): void
  cancelRedeem(): void
  selectPoolCurrency(symbol: string): void
}

export type InvestRedeemHooks = {
  useActionSucceeded(cb: (action: InvestRedeemAction) => void): void
}

export type InvestRedeemProviderProps = {
  poolId: string
  trancheId: string
  children: React.ReactNode
}

export type InvestRedeemContext = {
  state: InvestRedeemState
  actions: InvestRedeemActions
  hooks: InvestRedeemHooks
}
