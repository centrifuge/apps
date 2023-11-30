import { CurrencyBalance, InvestorTransactionType, Price } from '@centrifuge/centrifuge-js'
import { useAddress, useBalances, useCentrifugeQuery } from '@centrifuge/centrifuge-react'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import { useMemo } from 'react'
import { map, switchMap } from 'rxjs'
import { Dec } from '../../utils/Decimal'
import { useTinlakeBalances } from '../../utils/tinlake/useTinlakeBalances'
import { useDailyTranchesStates, usePools, useTransactionsByAddress } from '../../utils/usePools'

export const usePortfolioValue = () => {
  const address = useAddress()
  const centBalances = useBalances(address)
  const { data: tinlakeBalances } = useTinlakeBalances()

  const balances = useMemo(() => {
    return [
      ...(centBalances?.tranches || []),
      ...(tinlakeBalances?.tranches.filter((tranche) => !tranche.balance.isZero) || []),
    ]
  }, [centBalances, tinlakeBalances])
  const pools = usePools()

  const portfolioValue = balances.reduce((sum, balance) => {
    const pool = pools?.find((pool) => pool.id === balance.poolId)
    const tranche = pool?.tranches.find((tranche) => tranche.id === balance.trancheId)

    return sum.add(tranche?.tokenPrice ? balance.balance.toDecimal().mul(tranche?.tokenPrice.toDecimal()) : Dec(0))
  }, Dec(0))

  return portfolioValue
}

type InvestorTransaction = {
  currencyAmount: CurrencyBalance
  hash: string
  poolId: string
  timestamp: string
  tokenAmount: CurrencyBalance
  tokenPrice: Price
  trancheId: string
  type: InvestorTransactionType
}

type TrancheSnapshot = {
  blockNumber: number
  timestamp: string
  tokenPrice: Price
  trancheId: string
  tranche: {
    poolId: string
    trancheId: string
  }
}

export function useDailyPortfolioValue(address: string, rangeValue: number) {
  const today = new Date()

  const transactions = useTransactionsByAddress(address)

  const transactionsByTrancheId = useMemo(() => {
    if (transactions?.investorTransactions) {
      return transactions?.investorTransactions.reduce((acc, cur) => {
        const trancheId = cur.trancheId
        if (!acc[trancheId]) acc[trancheId] = []
        acc[trancheId].push(cur)
        return acc
      }, {} as Record<string, InvestorTransaction[]>)
    }
  }, [transactions?.investorTransactions])

  const dailyTrancheStates = useDailyTranchesStates(Object.keys(transactionsByTrancheId || {}))

  const dailyTrancheStatesByTrancheId = useMemo(() => {
    if (dailyTrancheStates?.length) {
      return dailyTrancheStates.reduce((acc, cur) => {
        if (cur.length === 0) return acc
        const trancheId = cur[0].tranche.trancheId
        acc[trancheId] = cur
        return acc
      }, {} as Record<string, TrancheSnapshot[]>)
    }
  }, [dailyTrancheStates])

  if (
    !transactionsByTrancheId ||
    !dailyTrancheStatesByTrancheId ||
    !dailyTrancheStates ||
    Object.keys(dailyTrancheStatesByTrancheId).length !== dailyTrancheStates.length
  )
    return

  return Array(rangeValue + 1)
    .fill(null)
    .map((_, i) => i)
    .map((day) => {
      const valueOfTranche = Object.keys(transactionsByTrancheId).map((trancheId) => {
        const transactions = transactionsByTrancheId[trancheId]

        const transactionsInDateRange = transactions.filter((transaction) => {
          const transactionDate = new Date(transaction.timestamp)

          return transactionDate <= new Date(today.getTime() - day * 1000 * 60 * 60 * 24)
        })

        return transactionsInDateRange.reduce((acc: Decimal, cur) => {
          if (cur.type === 'INVEST_EXECUTION' || cur.type === 'TRANSFER_IN') {
            const priceAtDate = dailyTrancheStatesByTrancheId[trancheId].slice(0 - rangeValue)?.find((state) => {
              return (
                `${new Date(state.timestamp).getMonth()}/${new Date(state.timestamp).getDate()}/${new Date(
                  state.timestamp
                ).getFullYear()}` ===
                `${new Date(today.getTime() - day * 1000 * 60 * 60 * 24).getMonth()}/${new Date(
                  today.getTime() - day * 1000 * 60 * 60 * 24
                ).getDate()}/${new Date(today.getTime() - day * 1000 * 60 * 60 * 24).getFullYear()}`
              )
            })?.tokenPrice

            if (!priceAtDate) return acc

            const price =
              priceAtDate.toString().length === 10
                ? new Price(priceAtDate.mul(new BN(10 ** 9))).toDecimal()
                : new Price(priceAtDate).toDecimal()

            const amount = cur.tokenAmount.toDecimal().mul(price)

            return acc.add(amount)
          }

          if (cur.type === 'REDEEM_EXECUTION' || cur.type === 'TRANSFER_OUT') {
            const priceAtDate = dailyTrancheStatesByTrancheId[trancheId].slice(0 - rangeValue)?.find((state) => {
              return (
                `${new Date(state.timestamp).getMonth()}/${new Date(state.timestamp).getDate()}/${new Date(
                  state.timestamp
                ).getFullYear()}` ===
                `${new Date(today.getTime() - day * 1000 * 60 * 60 * 24).getMonth()}/${new Date(
                  today.getTime() - day * 1000 * 60 * 60 * 24
                ).getDate()}/${new Date(today.getTime() - day * 1000 * 60 * 60 * 24).getFullYear()}`
              )
            })?.tokenPrice
            if (!priceAtDate) return acc

            const price =
              priceAtDate.toString().length === 10
                ? new Price(priceAtDate.mul(new BN(10 ** 9))).toDecimal()
                : new Price(priceAtDate).toDecimal()

            const amount = cur.tokenAmount.toDecimal().mul(price)

            return acc.sub(amount)
          }

          return acc
        }, Dec(0))
      })

      return valueOfTranche.reduce(
        (acc, cur) => ({
          portfolioValue: acc.portfolioValue.add(cur),
          dateInMilliseconds: new Date(today.getTime() - day * 1000 * 60 * 60 * 24),
        }),
        {
          portfolioValue: Dec(0),
        }
      )
    })
}

export function useInvestorPortfolio(address: string) {
  const portfolio = useCentrifugeQuery(['investorPortfolio', address], (cent) =>
    cent.getApi().pipe(
      switchMap((api) => api.call.portfolio.accountPortfolio(address)),
      map((response) => response.toJSON())
    )
  )

  return portfolio
}
