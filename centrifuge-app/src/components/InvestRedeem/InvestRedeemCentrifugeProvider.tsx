import { CurrencyBalance, findBalance, Pool } from '@centrifuge/centrifuge-js'
import { useBalances, useCentrifugeTransaction } from '@centrifuge/centrifuge-react'
import { CentrifugeTransactionOptions } from '@centrifuge/centrifuge-react/dist/hooks/useCentrifugeTransaction'
import BN from 'bn.js'
import * as React from 'react'
import { Dec } from '../../utils/Decimal'
import { useAddress } from '../../utils/useAddress'
import { useSuitableAccounts } from '../../utils/usePermissions'
import { usePendingCollect, usePool, usePoolMetadata } from '../../utils/usePools'
import { useLiquidityRewards } from '../LiquidityRewards/LiquidityRewardsContext'
import { InvestRedeemContext } from './InvestRedeemProvider'
import { InvestRedeemAction, InvestRedeemActions, InvestRedeemProviderProps as Props, InvestRedeemState } from './types'

export function InvestRedeemCentrifugeProvider({ poolId, trancheId, children }: Props) {
  const [account] = useSuitableAccounts({ poolId, poolRole: [{ trancheInvestor: trancheId }], proxyType: ['Invest'] })
  const fallbackAddress = useAddress('substrate')
  const address = account?.actingAddress || fallbackAddress
  const balances = useBalances(address)
  const order = usePendingCollect(poolId, trancheId, address)
  const pool = usePool(poolId) as Pool
  const [pendingAction, setPendingAction] = React.useState<InvestRedeemAction>()
  const isAllowedToInvest = !!account
  const tranche = pool.tranches.find((t) => t.id === trancheId)
  const { data: metadata, isLoading: isMetadataLoading } = usePoolMetadata(pool)
  const trancheMeta = metadata?.tranches?.[trancheId]
  const { state: liquidityState } = useLiquidityRewards()

  if (!tranche) throw new Error(`Token not found. Pool id: ${poolId}, token id: ${trancheId}`)

  const trancheBalance =
    balances?.tranches.find((t) => t.poolId === poolId && t.trancheId === trancheId)?.balance.toDecimal() ?? Dec(0)

  const price = tranche.tokenPrice?.toDecimal() ?? Dec(1)
  const investToCollect = order?.payoutTokenAmount.toDecimal() ?? Dec(0)
  const pendingRedeem = order?.remainingRedeemToken.toDecimal() ?? Dec(0)
  const stakedAmount = liquidityState?.combinedStakes ?? Dec(0)
  const combinedBalance = trancheBalance.add(investToCollect).add(pendingRedeem).add(stakedAmount)
  const investmentValue = combinedBalance.mul(price)
  const poolCurBalance =
    (balances && findBalance(balances.currencies, pool.currency.key)?.balance.toDecimal()) ?? Dec(0)
  const poolCurBalanceCombined = poolCurBalance.add(order?.remainingInvestCurrency.toDecimal() ?? 0)

  const isCalculatingOrders = pool.epoch.status !== 'ongoing'

  const invest = useCentrifugeTransaction('Invest', (cent) => cent.pools.updateInvestOrder)
  const redeem = useCentrifugeTransaction('Redeem', (cent) => cent.pools.updateRedeemOrder)
  const cancelInvest = useCentrifugeTransaction('Cancel order', (cent) => cent.pools.updateInvestOrder)
  const cancelRedeem = useCentrifugeTransaction('Cancel order', (cent) => cent.pools.updateRedeemOrder)

  const txActions = {
    invest,
    redeem,
    collect: undefined,
    approvePoolCurrency: undefined,
    approveTrancheToken: undefined,
    cancelInvest,
    cancelRedeem,
  }
  const pendingTransaction = pendingAction && txActions[pendingAction]?.lastCreatedTransaction

  function doAction<T = any>(
    name: InvestRedeemAction,
    fn: (arg: T) => any[],
    opt?: CentrifugeTransactionOptions
  ): (args?: T) => void {
    return (args) => {
      txActions[name]?.execute(fn(args!) as any, opt)
      setPendingAction(name)
    }
  }

  function useActionSucceeded(cb: (action: InvestRedeemAction) => void) {
    React.useEffect(() => {
      if (pendingAction && pendingTransaction?.status === 'succeeded') {
        cb(pendingAction)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingTransaction?.status])
  }

  const state: InvestRedeemState = {
    poolId,
    trancheId,
    isDataLoading: balances == null || order == null || isMetadataLoading,
    isAllowedToInvest,
    isPoolBusy: isCalculatingOrders,
    isFirstInvestment: order?.submittedAt === 0 && order.investCurrency.isZero(),
    nativeCurrency: balances?.native.currency,
    trancheCurrency: tranche.currency,
    poolCurrency: pool.currency,
    capacity: tranche.capacity.toDecimal(),
    minInitialInvestment: new CurrencyBalance(
      trancheMeta?.minInitialInvestment ?? 0,
      pool.currency.decimals
    ).toDecimal(),
    nativeBalance: balances?.native.balance.toDecimal() ?? Dec(0),
    poolCurrencyBalance: poolCurBalance,
    poolCUrrencyBalanceWithPending: poolCurBalanceCombined,
    trancheBalance,
    trancheBalanceWithPending: combinedBalance,
    investmentValue,
    tokenPrice: price,
    order: order
      ? {
          investCurrency: order.investCurrency.toDecimal(),
          redeemToken: order.redeemToken.toDecimal(),
          payoutCurrencyAmount: order.payoutCurrencyAmount.toDecimal(),
          payoutTokenAmount: order.payoutTokenAmount.toDecimal(),
          remainingInvestCurrency: order.remainingInvestCurrency.toDecimal(),
          remainingRedeemToken: order.remainingRedeemToken.toDecimal(),
        }
      : null,
    collectAmount: Dec(0),
    collectType: null,
    needsToCollectBeforeOrder: false,
    needsPoolCurrencyApproval: false,
    needsTrancheTokenApproval: false,
    pendingAction,
    pendingTransaction: pendingAction && txActions[pendingAction]?.lastCreatedTransaction,
  }

  const actions: InvestRedeemActions = {
    invest: doAction('invest', (newOrder: BN) => [poolId, trancheId, newOrder], { account, forceProxyType: 'Invest' }),
    redeem: doAction('redeem', (newOrder: BN) => [poolId, trancheId, newOrder], { account, forceProxyType: 'Invest' }),
    collect: () => {},
    approvePoolCurrency: () => {},
    approveTrancheToken: () => {},
    cancelInvest: doAction('cancelInvest', () => [poolId, trancheId, new BN(0)], { account, forceProxyType: 'Invest' }),
    cancelRedeem: doAction('cancelRedeem', () => [poolId, trancheId, new BN(0)], { account, forceProxyType: 'Invest' }),
  }

  const hooks = {
    useActionSucceeded,
  }

  return <InvestRedeemContext.Provider value={{ state, actions, hooks }}>{children}</InvestRedeemContext.Provider>
}
