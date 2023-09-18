import { CurrencyBalance, Pool } from '@centrifuge/centrifuge-js'
import { useCentrifuge, useEvmNativeBalance, useEvmNativeCurrency, useEvmProvider } from '@centrifuge/centrifuge-react'
import { TransactionRequest } from '@ethersproject/providers'
import BN from 'bn.js'
import * as React from 'react'
import { Dec } from '../../utils/Decimal'
import { useEvmTransaction } from '../../utils/tinlake/useEvmTransaction'
import { useAddress } from '../../utils/useAddress'
import { useLiquidityPoolInvestment, useLiquidityPools } from '../../utils/useLiquidityPools'
import { usePendingCollect, usePool, usePoolMetadata } from '../../utils/usePools'
import { InvestRedeemContext } from './InvestRedeemProvider'
import { InvestRedeemAction, InvestRedeemActions, InvestRedeemProviderProps as Props, InvestRedeemState } from './types'

export function InvestRedeemLiquidityPoolsProvider({ poolId, trancheId, children }: Props) {
  const centAddress = useAddress('substrate')
  const evmAddress = useAddress('evm')

  console.log('evmAddress', evmAddress)
  const { data: evmNativeBalance } = useEvmNativeBalance(evmAddress)
  const evmNativeCurrency = useEvmNativeCurrency()
  const centOrder = usePendingCollect(poolId, trancheId, centAddress)
  const pool = usePool(poolId) as Pool
  const cent = useCentrifuge()
  const [pendingActionState, setPendingAction] = React.useState<
    InvestRedeemAction | 'investWithPermit' | 'redeemWithPermit'
  >()
  const { isLoading: isLpsLoading } = useLiquidityPools(poolId, trancheId)
  const {
    data: lpInvest,
    refetch: refetchInvest,
    isLoading: isInvestmentLoading,
  } = useLiquidityPoolInvestment(poolId, trancheId)
  const provider = useEvmProvider()

  // const { data: lpEvents } = useLPEvents(poolId, trancheId, lpInvest?.lpAddress)
  const isAllowedToInvest = lpInvest?.isAllowedToInvest
  const tranche = pool.tranches.find((t) => t.id === trancheId)
  const { data: metadata, isLoading: isMetadataLoading } = usePoolMetadata(pool)
  const trancheMeta = metadata?.tranches?.[trancheId]

  if (!tranche) throw new Error(`Token not found. Pool id: ${poolId}, token id: ${trancheId}`)

  const trancheBalance = lpInvest?.tokenBalance?.toDecimal() ?? Dec(0)

  const price = lpInvest?.tokenPrice?.toDecimal() ?? Dec(1)
  const investToCollect = lpInvest?.maxMint.toDecimal() ?? Dec(0)
  const currencyToCollect = lpInvest?.maxWithdraw.toDecimal() ?? Dec(0)
  const pendingRedeem = lpInvest?.pendingRedeem.toDecimal() ?? Dec(0)
  const combinedTrancheBalance = trancheBalance.add(investToCollect).add(pendingRedeem)
  const investmentValue = combinedTrancheBalance.mul(price)
  const poolCurBalance = lpInvest?.currencyBalance.toDecimal() ?? Dec(0)
  const poolCurBalanceCombined = poolCurBalance.add(currencyToCollect).add(lpInvest?.pendingInvest.toDecimal() ?? 0)

  const isCalculatingOrders = pool.epoch.status !== 'ongoing'

  const collectType = investToCollect.gt(0) ? 'invest' : currencyToCollect.gt(0) ? 'redeem' : null

  const invest = useEvmTransaction('Invest', (cent) => cent.liquidityPools.updateInvestOrder)
  const investWithPermit = useEvmTransaction('Invest', (cent) => cent.liquidityPools.updateInvestOrderWithPermit)
  const redeem = useEvmTransaction('Redeem', (cent) => cent.liquidityPools.updateRedeemOrder)
  const redeemWithPermit = useEvmTransaction('Redeem', (cent) => cent.liquidityPools.updateRedeemOrderWithPermit)
  const collectInvest = useEvmTransaction('Collect', (cent) => cent.liquidityPools.mint)
  const collectRedeem = useEvmTransaction('Withdraw', (cent) => cent.liquidityPools.withdraw)
  const approve = useEvmTransaction('Approve', (cent) => cent.liquidityPools.approveForCurrency)
  const cancelInvest = useEvmTransaction('Cancel order', (cent) => cent.liquidityPools.updateInvestOrder)
  const cancelRedeem = useEvmTransaction('Cancel order', (cent) => cent.liquidityPools.updateRedeemOrder)

  const txActions = {
    invest,
    investWithPermit,
    redeem,
    redeemWithPermit,
    collect: collectType === 'invest' ? collectInvest : collectRedeem,
    approvePoolCurrency: approve,
    approveTrancheToken: approve,
    cancelInvest,
    cancelRedeem,
  }
  const pendingAction =
    pendingActionState === 'investWithPermit'
      ? 'invest'
      : pendingActionState === 'redeemWithPermit'
      ? 'redeem'
      : pendingActionState
  const pendingTransaction = pendingActionState && txActions[pendingActionState]?.lastCreatedTransaction
  // let statusMessage
  // if (order?.remainingInvestCurrency.isZero() && lpEvents?.find((e) => e.event === 'DepositRequested')) {
  //   statusMessage = 'Investment order is currently being bridged and will show up soon'
  // } else if (order?.remainingRedeemToken.isZero() && lpEvents?.find((e) => e.event === 'RedeemRequested')) {
  //   statusMessage = 'Redemption order is currently being bridged and will show up soon'
  // }

  function doAction<T = any>(
    name: InvestRedeemAction,
    fn: (arg: T) => any[] | Promise<any[]>,
    opt?: TransactionRequest
  ): (args?: T) => void {
    return (args) => {
      txActions[name]?.execute(fn(args!) as any, opt)
      setPendingAction(name)
    }
  }

  React.useEffect(() => {
    if (pendingAction && pendingTransaction?.status === 'succeeded') {
      refetchInvest()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingTransaction?.status])

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
    isDataLoading: isLpsLoading || isInvestmentLoading || isMetadataLoading,
    isAllowedToInvest,
    isPoolBusy: isCalculatingOrders,
    isFirstInvestment: centOrder?.submittedAt === 0 && centOrder.investCurrency.isZero(),
    nativeCurrency: evmNativeCurrency,
    trancheCurrency: tranche.currency,
    poolCurrency: lpInvest && {
      decimals: lpInvest.currencyDecimals,
      symbol: lpInvest.currencySymbol,
    },
    capacity: tranche.capacity.toDecimal(),
    minInitialInvestment: new CurrencyBalance(
      trancheMeta?.minInitialInvestment ?? 0,
      pool.currency.decimals
    ).toDecimal(),
    nativeBalance: evmNativeBalance?.toDecimal() ?? Dec(0),
    poolCurrencyBalance: poolCurBalance,
    poolCurrencyBalanceWithPending: poolCurBalanceCombined,
    trancheBalance,
    trancheBalanceWithPending: combinedTrancheBalance,
    investmentValue,
    tokenPrice: price,
    order:
      lpInvest && (!lpInvest?.pendingInvest.isZero() || !lpInvest?.pendingRedeem.isZero())
        ? {
            investCurrency: lpInvest.pendingInvest.toDecimal(),
            redeemToken: lpInvest.pendingRedeem.toDecimal(),
            payoutCurrencyAmount: lpInvest.maxWithdraw.toDecimal(),
            payoutTokenAmount: lpInvest.maxMint.toDecimal(),
            remainingInvestCurrency: lpInvest.pendingInvest.toDecimal(),
            remainingRedeemToken: lpInvest.pendingRedeem.toDecimal(),
          }
        : null,
    collectAmount: investToCollect.gt(0) ? investToCollect : currencyToCollect,
    collectType,
    needsToCollectBeforeOrder: false,
    needsPoolCurrencyApproval: (amount) =>
      lpInvest ? lpInvest.managerCurrencyAllowance.toFloat() < amount && !lpInvest.currencySupportsPermit : false,
    needsTrancheTokenApproval: (amount) =>
      lpInvest
        ? lpInvest.managerTrancheTokenAllowance.toFloat() < amount && !lpInvest.trancheTokenSupportsPermit
        : false,
    canChangeOrder: false,
    canCancelOrder: false,
    pendingAction,
    pendingTransaction,
    statusMessage: undefined,
  }

  const actions: InvestRedeemActions = {
    invest: async (newOrder: BN) => {
      if (!lpInvest) return
      // If the last tx was an approve, we may not have refetched the allowance yet,
      // so assume the allowance is enough to do a normal invest
      if (
        lpInvest.managerCurrencyAllowance.lt(newOrder) &&
        lpInvest.currencySupportsPermit &&
        pendingAction !== 'approvePoolCurrency'
      ) {
        const signer = provider!.getSigner()
        const connectedCent = cent.connectEvm(evmAddress!, signer)
        const permit = await connectedCent.liquidityPools.signPermit([
          lpInvest.managerAddress,
          lpInvest.currencyAddress,
        ])
        investWithPermit.execute([lpInvest.lpAddress, newOrder, permit])
        setPendingAction('investWithPermit')
      } else {
        invest.execute([lpInvest.lpAddress, newOrder])
        setPendingAction('invest')
      }
    },
    redeem: async (newOrder: BN) => {
      if (!lpInvest) return
      if (
        lpInvest.managerTrancheTokenAllowance.lt(newOrder) &&
        lpInvest.trancheTokenSupportsPermit &&
        pendingAction !== 'approveTrancheToken'
      ) {
        const signer = provider!.getSigner()
        const connectedCent = cent.connectEvm(evmAddress!, signer)
        const permit = await connectedCent.liquidityPools.signPermit([
          lpInvest.managerAddress,
          lpInvest.currencyAddress,
        ])
        redeemWithPermit.execute([lpInvest.lpAddress, newOrder, permit])
        setPendingAction('redeemWithPermit')
      } else {
        redeem.execute([lpInvest.lpAddress, newOrder])
        setPendingAction('redeem')
      }
    },
    collect: doAction('collect', () =>
      collectType === 'invest' ? [lpInvest?.lpAddress, lpInvest?.maxMint] : [lpInvest?.lpAddress, lpInvest?.maxWithdraw]
    ),
    approvePoolCurrency: doAction('approvePoolCurrency', () => [lpInvest?.managerAddress, lpInvest?.currencyAddress]),
    approveTrancheToken: doAction('approveTrancheToken', () => [lpInvest?.managerAddress, lpInvest?.lpAddress]),
    cancelInvest: doAction('cancelInvest', () => [lpInvest?.lpAddress, new BN(0)]),
    cancelRedeem: doAction('cancelRedeem', () => [lpInvest?.lpAddress, new BN(0)]),
  }

  const hooks = {
    useActionSucceeded,
  }

  return <InvestRedeemContext.Provider value={{ state, actions, hooks }}>{children}</InvestRedeemContext.Provider>
}
