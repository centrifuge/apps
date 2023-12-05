import { CurrencyBalance, CurrencyMetadata, InvestorTransactionType, Price, Token } from '@centrifuge/centrifuge-js'
import { useCentrifugeQuery } from '@centrifuge/centrifuge-react'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import { useMemo } from 'react'
import { Dec } from '../../utils/Decimal'
import { useDailyTranchesStates, usePools, useTransactionsByAddress } from '../../utils/usePools'

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
  const transactions = useTransactionsByAddress(address)

  const transactionsByTrancheId = transactions?.investorTransactions.reduce(
    (tranches, tranche) => ({
      ...tranches,
      [tranche.trancheId]: [...(tranches[tranche.trancheId] || []), tranche],
    }),
    {} as Record<string, InvestorTransaction[]>
  )

  const dailyTrancheStates = useDailyTranchesStates(Object.keys(transactionsByTrancheId || {}))

  const dailyTrancheStatesByTrancheId = dailyTrancheStates?.reduce((tranches, trancheSnapshots) => {
    if (trancheSnapshots.length) {
      const trancheId = trancheSnapshots[0].tranche.trancheId
      return {
        ...tranches,
        [trancheId]: trancheSnapshots,
      }
    }

    return tranches
  }, {} as Record<string, TrancheSnapshot[]>)

  return useMemo(() => {
    if (
      dailyTrancheStatesByTrancheId &&
      transactionsByTrancheId &&
      Object.keys(dailyTrancheStatesByTrancheId).length === dailyTrancheStates?.length
    ) {
      const today = new Date()

      return Array(rangeValue + 1)
        .fill(null)
        .map((_, i) => i)
        .map((day) => {
          const valueOfTranche = Object.entries(transactionsByTrancheId).map(([trancheId, transactions]) => {
            const transactionsInDateRange = transactions.filter(
              (transaction) => new Date(transaction.timestamp) <= new Date(today.getTime() - day * 1000 * 60 * 60 * 24)
            )

            return transactionsInDateRange.reduce((trancheValues: Decimal, transaction) => {
              const priceAtDate = getPriceAtDate(dailyTrancheStatesByTrancheId, trancheId, rangeValue, day, today)
              if (!priceAtDate) return trancheValues

              const price =
                priceAtDate.toString().length === 10 || priceAtDate.toString().length === 9
                  ? new Price(priceAtDate.mul(new BN(10 ** 9))).toDecimal()
                  : new Price(priceAtDate).toDecimal()

              const amount = transaction.tokenAmount.toDecimal().mul(price)

              if (transaction.type === 'INVEST_EXECUTION') {
                return trancheValues.add(amount)
              }

              if (transaction.type === 'REDEEM_EXECUTION') {
                return trancheValues.sub(amount)
              }

              return trancheValues
            }, Dec(0))
          })

          console.log(valueOfTranche)

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
  }, [dailyTrancheStates?.length, dailyTrancheStatesByTrancheId, rangeValue, transactionsByTrancheId])
}

const getPriceAtDate = (
  dailyTrancheStatesByTrancheId: Record<string, TrancheSnapshot[]>,
  trancheId: string,
  rangeValue: number,
  day: number,
  today: Date
) => {
  return dailyTrancheStatesByTrancheId[trancheId].slice(0 - rangeValue)?.find((state) => {
    return (
      `${new Date(state.timestamp).getMonth()}/${new Date(state.timestamp).getDate()}/${new Date(
        state.timestamp
      ).getFullYear()}` ===
      `${new Date(today.getTime() - day * 1000 * 60 * 60 * 24).getMonth()}/${new Date(
        today.getTime() - day * 1000 * 60 * 60 * 24
      ).getDate()}/${new Date(today.getTime() - day * 1000 * 60 * 60 * 24).getFullYear()}`
    )
  })?.tokenPrice
}

export function usePortfolio(address?: string) {
  const [result] = useCentrifugeQuery(['accountPortfolio', address], (cent) => cent.pools.getPortfolio([address!]), {
    enabled: !!address,
  })
  return result
}

type PortfolioToken = {
  position: Decimal
  marketValue: Decimal
  tokenPrice: Price
  trancheId: string
  poolId: string
  currency: Token['currency']
}

export function usePortfolioTokens(address?: string) {
  const pools = usePools()
  const portfolioData = usePortfolio(address)

  const trancheTokenPrices = pools?.reduce(
    (tranches, pool) =>
      pool.tranches.reduce((tranches, tranche) => {
        tranches[tranche.id] = {
          currency: tranche.currency,
          tokenPrice: tranche.tokenPrice,
          poolId: tranche.poolId,
        }
        return tranches
      }, tranches),
    {} as Record<string, { tokenPrice: Price | null; poolId: string; currency: CurrencyMetadata }>
  )

  if (portfolioData && trancheTokenPrices) {
    return Object.keys(portfolioData)?.reduce((sum, trancheId) => {
      const tranche = portfolioData[trancheId]

      const trancheTokenPrice = trancheTokenPrices[trancheId].tokenPrice || new Price(0)

      const trancheTokensBalance = tranche.claimableTrancheTokens
        .toDecimal()
        .add(tranche.freeTrancheTokens.toDecimal())
        .add(tranche.reservedTrancheTokens.toDecimal())
        .add(tranche.pendingRedeemTrancheTokens.toDecimal())

      return [
        ...sum,
        {
          position: trancheTokensBalance,
          marketValue: trancheTokensBalance.mul(trancheTokenPrice.toDecimal()),
          tokenPrice: trancheTokenPrice,
          trancheId: trancheId,
          poolId: trancheTokenPrices[trancheId].poolId,
          currency: trancheTokenPrices[trancheId].currency,
        },
      ]
    }, [] as PortfolioToken[])
  }

  return []
}
