import {
  CurrencyBalance,
  CurrencyMetadata,
  InvestorTransactionType,
  Price,
  Rate,
  Token,
  TokenBalance,
  addressToHex,
} from '@centrifuge/centrifuge-js'
import Decimal from 'decimal.js-light'
import { useMemo } from 'react'
import { Dec } from '../../utils/Decimal'
import { useDailyTranchesStates, usePools, useTransactionsByAddress } from '../../utils/usePools'
import { useSubquery } from '../../utils/useSubquery'

type InvestorTransaction = {
  currencyAmount: CurrencyBalance
  hash: string
  poolId: string
  timestamp: string
  tokenAmount: CurrencyBalance
  tokenPrice: Price
  trancheId: string
  type: InvestorTransactionType
  realizedProfitFifo?: CurrencyBalance
}

export function useDailyPortfolioValue(address: string, rangeValue?: number) {
  const { data: transactions } = useTransactionsByAddress(address)

  const transactionsByTrancheId = transactions?.investorTransactions.reduce(
    (tranches, tranche) => ({
      ...tranches,
      [tranche.trancheId]: [...(tranches[tranche.trancheId] || []), tranche],
    }),
    {} as Record<string, InvestorTransaction[]>
  )

  const daysSinceFirstTx = transactions?.investorTransactions?.[0]
    ? Math.ceil(
        (new Date().getTime() - new Date(transactions.investorTransactions.at(-1)!.timestamp).getTime()) /
          (1000 * 3600 * 24)
      )
    : 0

  const dailyTrancheStatesByTrancheId = useDailyTranchesStates(Object.keys(transactionsByTrancheId || {}))

  const rangeDays = (rangeValue ?? daysSinceFirstTx) + 1

  return useMemo(() => {
    if (dailyTrancheStatesByTrancheId && transactionsByTrancheId) {
      const today = new Date()

      return Array((rangeValue ?? daysSinceFirstTx) + 1)
        .fill(null)
        .map((_, i) => i)
        .map((day) => {
          const valueOfTranche = Object.entries(transactionsByTrancheId).map(([trancheId, transactions]) => {
            const transactionsInDateRange = transactions.filter(
              (transaction) => new Date(transaction.timestamp) <= new Date(today.getTime() - day * 1000 * 60 * 60 * 24)
            )

            return transactionsInDateRange.reduce(
              (trancheValues: { portfolioValue: Decimal; realizedProfitFifo: Decimal }, transaction) => {
                const priceAtDate = getPriceAtDate(dailyTrancheStatesByTrancheId, trancheId, rangeDays, day, today)
                if (!priceAtDate) return trancheValues

                const price = new Price(priceAtDate).toDecimal()
                const amount = transaction.tokenAmount.toDecimal().mul(price)
                const realizedProfitFifo = transaction.realizedProfitFifo?.toDecimal() ?? Dec(0)

                if (transaction.type === 'INVEST_EXECUTION') {
                  return {
                    portfolioValue: trancheValues.portfolioValue.add(amount),
                    realizedProfitFifo: trancheValues.realizedProfitFifo.add(realizedProfitFifo),
                  }
                }

                if (transaction.type === 'REDEEM_EXECUTION') {
                  return {
                    portfolioValue: trancheValues.portfolioValue.sub(amount),
                    realizedProfitFifo: trancheValues.realizedProfitFifo.add(realizedProfitFifo),
                  }
                }

                return trancheValues
              },
              { portfolioValue: Dec(0), realizedProfitFifo: Dec(0) }
            )
          })

          return valueOfTranche.reduce(
            (acc, cur) => ({
              portfolioValue: acc.portfolioValue.add(cur.portfolioValue),
              realizedProfitFifo: acc.realizedProfitFifo.add(cur.realizedProfitFifo),
              dateInMilliseconds: new Date(today.getTime() - day * 1000 * 60 * 60 * 24),
            }),
            {
              portfolioValue: Dec(0),
              realizedProfitFifo: Dec(0),
            }
          )
        })
    }
  }, [dailyTrancheStatesByTrancheId, daysSinceFirstTx, rangeDays, rangeValue, transactionsByTrancheId])
}

const getPriceAtDate = (
  dailyTrancheStatesByTrancheId: Record<
    string,
    {
      timestamp: string
      tokenPrice: Price
    }[]
  >,
  trancheId: string,
  rangeValue: number,
  day: number,
  today: Date
) => {
  return new Price(
    dailyTrancheStatesByTrancheId[trancheId].slice(0 - rangeValue)?.find((state) => {
      return (
        `${new Date(state.timestamp).getMonth()}/${new Date(state.timestamp).getDate()}/${new Date(
          state.timestamp
        ).getFullYear()}` ===
        `${new Date(today.getTime() - day * 1000 * 60 * 60 * 24).getMonth()}/${new Date(
          today.getTime() - day * 1000 * 60 * 60 * 24
        ).getDate()}/${new Date(today.getTime() - day * 1000 * 60 * 60 * 24).getFullYear()}`
      )
    })?.tokenPrice ?? Price.fromFloat(1)
  )
}

export function usePortfolio(substrateAddress?: string) {
  const pools = usePools()
  const { data: subData } = useSubquery(
    `query ($account: String!) {
    account(
      id: $account
    ) {
      trancheBalances {
        nodes {
          claimableCurrency
          claimableTrancheTokens
          pendingInvestCurrency
          pendingRedeemTrancheTokens
          sumClaimedCurrency
          sumClaimedTrancheTokens
          trancheId
          poolId
          account {
            chainId
          }
          tranche {
            tokenPrice
          }
          pool {
            currency {
              decimals
            }
          }
        }
      }
      currencyBalances {
        nodes {
          amount
          currency {
            symbol
            decimals
            trancheId
          }
        }
      }
      investorPositions {
        nodes {
          holdingQuantity
          poolId
          purchasePrice
          timestamp
          trancheId
        }
      }
    }
  }`,
    {
      account: substrateAddress && addressToHex(substrateAddress),
    },
    {
      enabled: !!substrateAddress,
    }
  )

  const data = useMemo(() => {
    const trancheBalances: Record<
      string,
      {
        totalTrancheTokens: TokenBalance
        tokenPrice: Price
        purchasePrice: Price
        unrealizedProfit: CurrencyBalance
        realizedProfit: CurrencyBalance
        unrealizedYield: Rate
        chainId: number
      }
    > = {}

    subData?.account?.investorPositions.nodes.forEach((position: any) => {
      const chainId = subData.account.trancheBalances.nodes.find(
        (tranche: { trancheId: string }) => tranche.trancheId === position.trancheId
      ).account.chainId
      const pool = pools?.find((p) => p.id === position.poolId)
      const trancheId = position.trancheId.split('-')[1]
      const decimals = pool?.currency.decimals ?? 18
      const tokenPrice = pool?.tranches.find((t) => trancheId === t.id)?.tokenPrice ?? Price.fromFloat(1)
      const balance = new TokenBalance(position.holdingQuantity, decimals)
      const existing = trancheBalances[trancheId]
      if (existing) {
        existing.totalTrancheTokens.iadd(balance)

        const initialPrice = existing.purchasePrice.toDecimal()
        const tokenPriceDiff = tokenPrice.toDecimal().sub(initialPrice)
        existing.unrealizedProfit = CurrencyBalance.fromFloat(
          tokenPrice.toDecimal().sub(initialPrice).mul(existing.totalTrancheTokens.toDecimal()),
          decimals
        )
        existing.unrealizedYield = Rate.fromFloat(tokenPriceDiff.div(initialPrice))
      } else {
        const initialPrice = new Price(position.purchasePrice).toDecimal()
        const tokenPriceDiff = tokenPrice.toDecimal().sub(initialPrice)

        trancheBalances[trancheId] = {
          totalTrancheTokens: balance,
          purchasePrice: new Price(position.purchasePrice),
          tokenPrice,
          realizedProfit: new CurrencyBalance(0, decimals),
          unrealizedProfit: CurrencyBalance.fromFloat(
            tokenPrice.toDecimal().sub(initialPrice).mul(new CurrencyBalance(balance, decimals).toDecimal()),
            decimals
          ),
          unrealizedYield: Rate.fromFloat(tokenPriceDiff.div(initialPrice)),
          chainId,
        }
      }
    })
    return trancheBalances
  }, [subData, pools])

  return data
}

type PortfolioToken = {
  position: Decimal
  marketValue: Decimal
  tokenPrice: Price
  trancheId: string
  poolId: string
  currency: Token['currency']
  realizedProfit: CurrencyBalance
  unrealizedProfit: CurrencyBalance
  unrealizedYield: Rate
  chainId: number
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
          realizedProfit: portfolioData[tranche.id]?.realizedProfit,
          unrealizedProfit: portfolioData[tranche.id]?.unrealizedProfit,
          unrealizedYield: portfolioData[tranche.id]?.unrealizedYield,
        }
        return tranches
      }, tranches),
    {} as Record<
      string,
      {
        tokenPrice: Price | null
        poolId: string
        currency: CurrencyMetadata
        realizedProfit: CurrencyBalance
        unrealizedProfit: CurrencyBalance
        unrealizedYield: Rate | null
      }
    >
  )

  if (portfolioData && trancheTokenPrices) {
    return Object.entries(portfolioData).map(([trancheId, tranche]) => {
      const trancheTokenPrice = trancheTokenPrices[trancheId].tokenPrice || new Price(0)

      const trancheTokensBalance = tranche.totalTrancheTokens.toDecimal()

      return {
        position: trancheTokensBalance,
        marketValue: trancheTokensBalance.mul(trancheTokenPrice.toDecimal()),
        tokenPrice: trancheTokenPrice,
        trancheId: trancheId,
        poolId: trancheTokenPrices[trancheId].poolId,
        currency: trancheTokenPrices[trancheId].currency,
        realizedProfit: trancheTokenPrices[trancheId].realizedProfit,
        unrealizedProfit: trancheTokenPrices[trancheId].unrealizedProfit,
        unrealizedYield: trancheTokenPrices[trancheId].unrealizedYield,
        chainId: portfolioData[trancheId]?.chainId,
      }
    }, [] as PortfolioToken[])
  }

  return []
}
