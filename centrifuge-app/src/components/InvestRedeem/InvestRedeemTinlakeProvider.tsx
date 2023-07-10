import { CurrencyBalance, findBalance } from '@centrifuge/centrifuge-js'
import { useWallet } from '@centrifuge/centrifuge-react'
import { getChainInfo } from '@centrifuge/centrifuge-react/dist/components/WalletProvider/evm/chains'
import { useNativeBalance } from '@centrifuge/centrifuge-react/dist/components/WalletProvider/evm/utils'
import BN from 'bn.js'
import * as React from 'react'
import { Dec } from '../../utils/Decimal'
import { useTinlakeBalances } from '../../utils/tinlake/useTinlakeBalances'
import { useTinlakeInvestments } from '../../utils/tinlake/useTinlakeInvestments'
import { useTinlakePermissions } from '../../utils/tinlake/useTinlakePermissions'
import { TinlakePool } from '../../utils/tinlake/useTinlakePools'
import { useTinlakeTransaction } from '../../utils/tinlake/useTinlakeTransaction'
import { useAddress } from '../../utils/useAddress'
import { usePool, usePoolMetadata } from '../../utils/usePools'
import { InvestRedeemContext } from './InvestRedeemProvider'
import { InvestRedeemAction, InvestRedeemActions, InvestRedeemProviderProps as Props, InvestRedeemState } from './types'

export function InvestRedeemTinlakeProvider({ poolId, trancheId, children }: Props) {
  const address = useAddress('evm')
  const { evm } = useWallet()
  const pool = usePool(poolId) as TinlakePool
  const [pendingAction, setPendingAction] = React.useState<InvestRedeemAction>()
  const tranche = pool.tranches.find((t) => t.id === trancheId)
  const { data: metadata } = usePoolMetadata(pool)
  const trancheMeta = metadata?.tranches?.[trancheId]
  const seniority = tranche?.seniority === 0 ? 'junior' : 'senior'

  if (!tranche) throw new Error(`Token not found. Pool id: ${poolId}, token id: ${trancheId}`)

  const { data: investment, refetch: refetchInvestment } = useTinlakeInvestments(poolId, address)
  const { data: balances, refetch: refetchBalances, isLoading: isBalancesLoading } = useTinlakeBalances()
  const { data: nativeBalance, refetch: refetchBalance, isLoading: isBalanceLoading } = useNativeBalance()
  const { data: permissions, isLoading: isPermissionsLoading } = useTinlakePermissions(poolId, address)
  const trancheInvestment = investment?.[seniority]
  const { disburse, order } = trancheInvestment ?? {}
  const trancheBalance =
    balances?.tranches.find((t) => t.poolId === poolId && t.trancheId === trancheId)?.balance.toDecimal() || Dec(0)
  const poolCurrencyBalance =
    (balances && findBalance(balances.currencies, pool.currency.key)?.balance.toDecimal()) || Dec(0)

  const price = tranche.tokenPrice?.toDecimal() || Dec(1)
  const investToCollect = trancheInvestment?.disburse.payoutTokenAmount || Dec(0)
  const pendingRedeem = trancheInvestment?.disburse.remainingRedeemToken || Dec(0)
  const combinedBalance = trancheBalance.add(investToCollect).add(pendingRedeem)
  const investmentValue = combinedBalance.mul(price)
  const collectAmount = (disburse?.payoutCurrencyAmount || Dec(0)).add(disburse?.payoutTokenAmount || 0)

  const isCalculatingOrders = pool.epoch.status !== 'ongoing'

  const invest = useTinlakeTransaction(poolId, 'Invest', (cent) => cent.tinlake.updateInvestOrder)
  const redeem = useTinlakeTransaction(poolId, 'Redeem', (cent) => cent.tinlake.updateRedeemOrder)
  const approvePoolCurrency = useTinlakeTransaction(poolId, 'Approve', (cent) => cent.tinlake.approveTrancheForCurrency)
  const approveTrancheToken = useTinlakeTransaction(poolId, 'Approve', (cent) => cent.tinlake.approveTrancheToken)
  const cancelInvest = useTinlakeTransaction(poolId, 'Cancel order', (cent) => cent.tinlake.updateInvestOrder)
  const cancelRedeem = useTinlakeTransaction(poolId, 'Cancel order', (cent) => cent.tinlake.updateRedeemOrder)
  const collect = useTinlakeTransaction(poolId, 'Collect', (cent) => cent.tinlake.collect)

  const txActions = {
    invest,
    redeem,
    collect,
    approvePoolCurrency,
    approveTrancheToken,
    cancelInvest,
    cancelRedeem,
  }
  const pendingTransaction = pendingAction && txActions[pendingAction]?.lastCreatedTransaction

  function doAction<T = any>(name: InvestRedeemAction, fn: (arg: T) => any[]): (args?: T) => void {
    return (args) => {
      txActions[name]?.execute(fn(args!) as any)
      setPendingAction(name)
    }
  }

  function useActionSucceeded(cb: (action: InvestRedeemAction) => void) {
    React.useEffect(() => {
      if (pendingAction && pendingTransaction?.status === 'succeeded') {
        refetchInvestment()
        refetchBalance()
        refetchBalances()
        cb(pendingAction)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingTransaction?.status])
  }

  const state: InvestRedeemState = {
    poolId,
    trancheId,
    isDataLoading: isBalancesLoading || isBalanceLoading || isPermissionsLoading,
    isAllowedToInvest: permissions?.[seniority].inMemberlist,
    isPoolBusy: isCalculatingOrders,
    isFirstInvestment: Object.values(order || {}).every((v) => Dec(v).isZero()),
    nativeCurrency: getChainInfo(evm.chains, evm.chainId!).nativeCurrency,
    trancheCurrency: tranche.currency,
    poolCurrency: pool.currency,
    capacity: tranche.capacity.toDecimal(),
    minInitialInvestment: new CurrencyBalance(
      trancheMeta?.minInitialInvestment || 0,
      pool.currency.decimals
    ).toDecimal(),
    nativeBalance: nativeBalance?.toDecimal() || Dec(0),
    poolCurrencyBalance: poolCurrencyBalance,
    poolCUrrencyBalanceWithPending: poolCurrencyBalance.add(disburse?.remainingInvestCurrency || 0),
    trancheBalance,
    trancheBalanceWithPending: combinedBalance,
    investmentValue,
    tokenPrice: price,
    order: {
      investCurrency: order?.investCurrency || Dec(0),
      redeemToken: order?.redeemToken || Dec(0),
      payoutCurrencyAmount: disburse?.payoutCurrencyAmount || Dec(0),
      payoutTokenAmount: disburse?.payoutTokenAmount || Dec(0),
      remainingInvestCurrency: disburse?.remainingInvestCurrency || Dec(0),
      remainingRedeemToken: disburse?.remainingRedeemToken || Dec(0),
    },
    collectAmount,
    collectType: disburse?.payoutCurrencyAmount.isZero() ? 'invest' : 'redeem',
    needsToCollectBeforeOrder: !collectAmount.isZero(),
    needsPoolCurrencyApproval: !!trancheInvestment?.poolCurrencyAllowance.isZero(),
    needsTrancheTokenApproval: !!trancheInvestment?.tokenAllowance.isZero(),
    pendingAction,
    pendingTransaction: pendingAction && txActions[pendingAction]?.lastCreatedTransaction,
  }

  const actions: InvestRedeemActions = {
    invest: doAction('invest', (newOrder: BN) => [seniority, newOrder]),
    redeem: doAction('redeem', (newOrder: BN) => [seniority, newOrder]),
    collect: doAction('collect', () => [seniority]),
    approvePoolCurrency: doAction('approvePoolCurrency', () => [seniority]),
    approveTrancheToken: doAction('approveTrancheToken', () => [seniority]),
    cancelInvest: doAction('cancelInvest', () => [seniority, new BN(0)]),
    cancelRedeem: doAction('cancelRedeem', () => [seniority, new BN(0)]),
  }

  const hooks = {
    useActionSucceeded,
  }

  return <InvestRedeemContext.Provider value={{ state, actions, hooks }}>{children}</InvestRedeemContext.Provider>
}
