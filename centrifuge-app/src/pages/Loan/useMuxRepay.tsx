import { CurrencyBalance, findBalance } from '@centrifuge/centrifuge-js'
import { useBalances, useCentrifugeApi, wrapProxyCallsForAccount } from '@centrifuge/centrifuge-react'
import Decimal from 'decimal.js-light'
import { of } from 'rxjs'
import { Dec } from '../../utils/Decimal'
import { useBorrower } from '../../utils/usePermissions'
import { usePool } from '../../utils/usePools'

export function useMuxRepay(poolId: string, loanId: string) {
  const pool = usePool(poolId)
  const borrower = useBorrower(poolId, loanId)
  const api = useCentrifugeApi()
  const balances = useBalances(borrower?.actingAddress)
  const poolCurBalance =
    (balances && findBalance(balances.currencies, pool.currency.key)?.balance.toDecimal()) || Dec(0)
  const isLocal = typeof pool?.currency?.key !== 'string' && 'LocalAsset' in pool.currency.key

  const muxableBalances = balances?.currencies?.filter(
    (cur) =>
      isLocal && String(cur.currency.additional?.localRepresentation) === String((pool.currency.key as any).LocalAsset)
  )
  const totalMuxableBalance = muxableBalances?.reduce((acc, cur) => acc.add(cur.balance.toDecimal()), Dec(0)) || Dec(0)

  const totalAvailable = isLocal ? poolCurBalance.add(totalMuxableBalance) : poolCurBalance

  return {
    totalAvailable,
    isValid: (totalRepay: Decimal, destination: string) => {
      return destination !== 'reserve' || totalAvailable.gte(totalRepay)
    },
    getBatch: (totalRepay: Decimal, destination: string) => {
      if (destination !== 'reserve' || poolCurBalance.gte(totalRepay)) {
        return of([])
      }
      const batch = []
      let remainder = totalRepay.sub(poolCurBalance)
      for (const balance of muxableBalances || []) {
        if (remainder.lte(Dec(0))) {
          break
        }
        const amount = remainder.gt(balance.balance.toDecimal()) ? balance.balance.toDecimal() : remainder
        remainder = remainder.sub(amount)
        const tx = api.tx.tokenMux.deposit(
          balance.currency.key,
          CurrencyBalance.fromFloat(amount, balance.currency.decimals)
        )
        batch.push(wrapProxyCallsForAccount(api, tx, borrower!, 'Borrow'))
      }
      return of(batch)
    },
  }
}
