import { CurrencyBalance, CurrencyMetadata, Pool } from '@centrifuge/centrifuge-js'
import {
  useCentrifuge,
  useCentrifugeApi,
  useCentrifugeConsts,
  useCentrifugeQuery,
  useEvmNativeBalance,
  useEvmNativeCurrency,
  useEvmProvider,
  useWallet,
} from '@centrifuge/centrifuge-react'
import { TransactionRequest } from '@ethersproject/providers'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import * as React from 'react'
import { map } from 'rxjs'
import { Dec } from '../../utils/Decimal'
import { useEvmTransaction } from '../../utils/tinlake/useEvmTransaction'
import { useAddress } from '../../utils/useAddress'
import { useLiquidityPoolInvestment, useLiquidityPools, useLPEvents } from '../../utils/useLiquidityPools'
import { usePendingCollect, usePool, usePoolMetadata } from '../../utils/usePools'
import { useDebugFlags } from '../DebugFlags'
import { InvestRedeemContext } from './InvestRedeemProvider'
import { InvestRedeemAction, InvestRedeemActions, InvestRedeemProviderProps as Props, InvestRedeemState } from './types'

export function InvestRedeemLiquidityPoolsProvider({ poolId, trancheId, children }: Props) {
  const centAddress = useAddress('substrate')
  const evmAddress = useAddress('evm')
  const { allowInvestBelowMin } = useDebugFlags()
  const {
    evm: { isSmartContractWallet },
  } = useWallet()
  const consts = useCentrifugeConsts()
  const [lpIndex, setLpIndex] = React.useState(0)

  const { data: evmNativeBalance } = useEvmNativeBalance(evmAddress)
  const evmNativeCurrency = useEvmNativeCurrency()
  const centOrder = usePendingCollect(poolId, trancheId, centAddress)
  const pool = usePool(poolId) as Pool
  const cent = useCentrifuge()
  const [pendingActionState, setPendingAction] = React.useState<
    InvestRedeemAction | 'investWithPermit' | 'decreaseInvest'
  >()
  const { isLoading: isLpsLoading, data: lps } = useLiquidityPools(poolId, trancheId)
  const {
    data: lpInvest,
    refetch: refetchInvest,
    isLoading: isInvestmentLoading,
  } = useLiquidityPoolInvestment(poolId, trancheId, lpIndex)
  const provider = useEvmProvider()

  const { data: lpEvents } = useLPEvents(poolId, trancheId, lpInvest?.lpAddress)
  const isAllowedToInvest = lpInvest?.isAllowedToInvest
  const tranche = pool.tranches.find((t) => t.id === trancheId)
  const { data: metadata, isLoading: isMetadataLoading } = usePoolMetadata(pool)
  const trancheMeta = metadata?.tranches?.[trancheId]

  if (!tranche) throw new Error(`Token not found. Pool id: ${poolId}, token id: ${trancheId}`)

  const trancheBalance = lpInvest?.tokenBalance?.toDecimal() ?? Dec(0)

  const price = tranche?.tokenPrice?.toDecimal() ?? Dec(1)
  const investToCollect = lpInvest?.maxMint.toDecimal() ?? Dec(0)
  const currencyToCollect = lpInvest?.maxWithdraw.toDecimal() ?? Dec(0)
  const pendingRedeem = lpInvest?.pendingRedeem.toDecimal() ?? Dec(0)
  const combinedTrancheBalance = trancheBalance.add(investToCollect).add(pendingRedeem)
  const investmentValue = combinedTrancheBalance.mul(price)
  const poolCurBalance = lpInvest?.currencyBalance.toDecimal() ?? Dec(0)
  const poolCurBalanceCombined = poolCurBalance.add(currencyToCollect).add(lpInvest?.pendingInvest.toDecimal() ?? 0)

  const isCalculatingOrders = pool.epoch.status !== 'ongoing'

  const collectType = currencyToCollect.gt(0) ? 'redeem' : investToCollect.gt(0) ? 'invest' : null

  const assetPairMinOrder = useAssetPair(pool.currency, lpInvest?.currency)
  const minOrder = max(assetPairMinOrder?.toDecimal() ?? Dec(0), consts.orderBook.minFulfillment.toDecimal())

  const invest = useEvmTransaction('Invest', (cent) => cent.liquidityPools.increaseInvestOrder)
  const decreaseInvest = useEvmTransaction('Invest', (cent) => cent.liquidityPools.decreaseInvestOrder)
  const investWithPermit = useEvmTransaction('Invest', (cent) => cent.liquidityPools.increaseInvestOrderWithPermit)
  const redeem = useEvmTransaction('Redeem', (cent) => cent.liquidityPools.increaseRedeemOrder)
  const collectInvest = useEvmTransaction('Collect', (cent) => cent.liquidityPools.mint)
  const collectRedeem = useEvmTransaction('Withdraw', (cent) => cent.liquidityPools.withdraw)
  const approve = useEvmTransaction('Approve', (cent) => cent.liquidityPools.approveForCurrency)
  const cancelInvest = useEvmTransaction('Cancel order', (cent) => cent.liquidityPools.cancelInvestOrder)
  const cancelRedeem = useEvmTransaction('Cancel order', (cent) => cent.liquidityPools.cancelRedeemOrder)

  const txActions = {
    invest,
    investWithPermit,
    decreaseInvest,
    redeem,
    collect: collectType === 'invest' ? collectInvest : collectRedeem,
    approvePoolCurrency: approve,
    approveTrancheToken: approve,
    cancelInvest,
    cancelRedeem,
  }
  const pendingAction = ['investWithPermit', 'decreaseInvest'].includes(pendingActionState!)
    ? 'invest'
    : (pendingActionState as InvestRedeemAction | undefined)
  const pendingTransaction = pendingActionState && txActions[pendingActionState]?.lastCreatedTransaction
  let statusMessage
  if (
    lpInvest?.pendingInvest &&
    !lpInvest.pendingInvest.isZero() &&
    lpEvents?.find((e) => e.event === 'CancelDepositRequest')
  ) {
    statusMessage = 'Order cancellation is currently being bridged and will show up soon'
  } else if (
    lpInvest?.pendingRedeem &&
    !lpInvest.pendingRedeem.isZero() &&
    lpEvents?.find((e) => e.event === 'CancelRedeemRequest')
  ) {
    statusMessage = 'Order cancellation is currently being bridged and will show up soon'
  }

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

  React.useEffect(() => {
    if (lps && lps.length > 1) {
      const index = lps?.findIndex((lp) => lp.currency.symbol === 'USDC')
      if (index && index > -1) {
        setLpIndex(index)
      }
    }
  }, [lps])

  const supportsPermits = lpInvest?.currencySupportsPermit && !isSmartContractWallet

  const state: InvestRedeemState = {
    poolId,
    trancheId,
    isDataLoading: isLpsLoading || isInvestmentLoading || isMetadataLoading,
    isAllowedToInvest,
    isPoolBusy: isCalculatingOrders,
    isFirstInvestment: centOrder?.submittedAt === 0 && centOrder.investCurrency.isZero(),
    nativeCurrency: evmNativeCurrency,
    trancheCurrency: tranche.currency,
    poolCurrency: lpInvest?.currency,
    capacity: tranche.capacity.toDecimal(),
    minInitialInvestment: new CurrencyBalance(
      trancheMeta?.minInitialInvestment ?? 0,
      pool.currency.decimals
    ).toDecimal(),
    minOrder,
    nativeBalance: evmNativeBalance?.toDecimal() ?? Dec(0),
    poolCurrencies: lps?.map((lp) => ({ symbol: lp.currency.symbol })) ?? [],
    poolCurrencyBalance: poolCurBalance,
    poolCurrencyBalanceWithPending: poolCurBalanceCombined,
    trancheBalance,
    trancheBalanceWithPending: combinedTrancheBalance,
    investmentValue,
    tokenPrice: price,
    order: lpInvest
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
    needsToCollectBeforeOrder: true,
    needsPoolCurrencyApproval: (amount) =>
      lpInvest ? lpInvest.lpCurrencyAllowance.toFloat() < amount && !supportsPermits : false,
    needsTrancheTokenApproval: () => false,
    canChangeOrder: !!allowInvestBelowMin,
    canCancelOrder: true,
    pendingAction,
    pendingTransaction,
    statusMessage,
    actingAddress: centAddress,
  }

  const actions: InvestRedeemActions = {
    invest: async (newOrder: BN) => {
      if (!lpInvest) return

      let assets = newOrder.sub(lpInvest.pendingInvest)
      if (assets.lt(new BN(0))) {
        assets = assets.abs()
        decreaseInvest.execute([lpInvest.lpAddress, assets])
        setPendingAction('invest')
      }

      // If the last tx was an approve, we may not have refetched the allowance yet,
      // so assume the allowance is enough to do a normal invest
      else if (lpInvest.lpCurrencyAllowance.lt(assets) && supportsPermits && pendingAction !== 'approvePoolCurrency') {
        const signer = provider!.getSigner()
        const connectedCent = cent.connectEvm(evmAddress!, signer)
        const permit = await connectedCent.liquidityPools.signPermit([
          lpInvest.lpAddress,
          lpInvest.currency.address,
          assets,
        ])
        console.log('permit', permit)
        investWithPermit.execute([lpInvest.lpAddress, assets, permit])
        setPendingAction('investWithPermit')
      } else {
        invest.execute([lpInvest.lpAddress, assets])
        setPendingAction('invest')
      }
    },
    redeem: async (newOrder: BN) => {
      if (!lpInvest) return
      redeem.execute([lpInvest.lpAddress, newOrder])
      setPendingAction('redeem')
    },
    collect: doAction('collect', () =>
      collectType === 'invest' ? [lpInvest?.lpAddress, lpInvest?.maxMint] : [lpInvest?.lpAddress, lpInvest?.maxWithdraw]
    ),
    approvePoolCurrency: doAction('approvePoolCurrency', (amount) => [
      lpInvest?.lpAddress,
      lpInvest?.currency.address,
      amount.toString(),
    ]),
    approveTrancheToken: () => {},
    cancelInvest: doAction('cancelInvest', () => [lpInvest?.lpAddress]),
    cancelRedeem: doAction('cancelRedeem', () => [lpInvest?.lpAddress]),
    selectPoolCurrency(symbol) {
      setLpIndex(lps!.findIndex((lp) => lp.currency.symbol === symbol))
    },
  }

  const hooks = {
    useActionSucceeded,
  }

  return <InvestRedeemContext.Provider value={{ state, actions, hooks }}>{children}</InvestRedeemContext.Provider>
}

function useAssetPair(currency: CurrencyMetadata, otherCurrency?: CurrencyMetadata) {
  const api = useCentrifugeApi()
  const [data] = useCentrifugeQuery(
    ['assetPair', currency.key, otherCurrency?.key],
    () =>
      api.query.orderBook.tradingPair(currency.key, otherCurrency!.key).pipe(
        map((minOrderData) => {
          return new CurrencyBalance(minOrderData.toPrimitive() as string, otherCurrency!.decimals)
        })
      ),
    { enabled: !!otherCurrency }
  )
  return data
}

function max(...nums: Decimal[]) {
  return nums.reduce((a, b) => (a.greaterThan(b) ? b : a))
}
