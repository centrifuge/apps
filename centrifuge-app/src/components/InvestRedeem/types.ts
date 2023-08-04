import { CurrencyMetadata } from '@centrifuge/centrifuge-js'
import { Transaction } from '@centrifuge/centrifuge-react'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import * as React from 'react'

type CurrencyMeta = Pick<CurrencyMetadata, 'decimals' | 'symbol'>

export type InvestRedeemAction =
  | 'invest'
  | 'redeem'
  | 'collect'
  | 'approvePoolCurrency'
  | 'approveTrancheToken'
  | 'cancelInvest'
  | 'cancelRedeem'

export type InvestRedeemState = {
  poolId: string
  trancheId: string
  isDataLoading: boolean
  isAllowedToInvest?: boolean
  isPoolBusy: boolean
  isFirstInvestment: boolean
  nativeCurrency?: CurrencyMeta
  poolCurrency?: CurrencyMeta
  trancheCurrency?: CurrencyMeta
  capacity: Decimal
  minInitialInvestment: Decimal
  nativeBalance: Decimal
  poolCurrencyBalance: Decimal
  poolCUrrencyBalanceWithPending: Decimal
  trancheBalance: Decimal
  trancheBalanceWithPending: Decimal
  investmentValue: Decimal
  tokenPrice: Decimal
  order?: {
    investCurrency: Decimal
    redeemToken: Decimal
    payoutCurrencyAmount: Decimal
    payoutTokenAmount: Decimal
    remainingInvestCurrency: Decimal
    remainingRedeemToken: Decimal
  } | null
  collectAmount: Decimal
  collectType: 'invest' | 'redeem' | null
  needsToCollectBeforeOrder: boolean
  needsPoolCurrencyApproval: boolean
  needsTrancheTokenApproval: boolean
  pendingAction?: InvestRedeemAction | null
  pendingTransaction?: Transaction | null
}

export type ActionOptions = {
  onError?: (error: Error) => void
  onSuccess?: (args: any[]) => void
}

export type InvestRedeemActions = {
  invest(newOrder: BN): void
  redeem(newOrder: BN): void
  collect(): void
  approvePoolCurrency(): void
  approveTrancheToken(): void
  cancelInvest(): void
  cancelRedeem(): void
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
