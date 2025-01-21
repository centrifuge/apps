import {
  CurrencyBalance,
  CurrencyMetadata,
  InvestorTransactionType,
  Perquintill,
  Price,
  Token,
  TokenBalance,
  addressToHex,
} from '@centrifuge/centrifuge-js'
import BN from 'bn.js'
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
}

export function useDailyPortfolioValue(address: string, rangeValue?: number) {
  const transactions = useTransactionsByAddress(address)

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

            return transactionsInDateRange.reduce((trancheValues: Decimal, transaction) => {
              const priceAtDate = getPriceAtDate(dailyTrancheStatesByTrancheId, trancheId, rangeDays, day, today)
              if (!priceAtDate) return trancheValues

              // TODO: remove this once we have the correct price -- https://github.com/centrifuge/pools-subql/issues/76
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
          tranche {
            yieldSinceInception
            pool {
              sumUnrealizedProfitAtMarketPrice
              sumRealizedProfitFifoByPeriod
            }
          }
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
        unrealizedProfit: CurrencyBalance
        realizedProfit: CurrencyBalance
        yieldSinceInception: Perquintill | null
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
      } else {
        trancheBalances[trancheId] = {
          totalTrancheTokens: balance,
          tokenPrice,
          realizedProfit: new CurrencyBalance(position.tranche.pool.sumRealizedProfitFifoByPeriod, decimals),
          unrealizedProfit: new CurrencyBalance(position.tranche.pool.sumUnrealizedProfitAtMarketPrice, decimals),
          yieldSinceInception: new Perquintill(position.tranche.yieldSinceInception),
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
  yieldSinceInception: Perquintill
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
          yieldSinceInception: portfolioData[tranche.id]?.yieldSinceInception,
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
        yieldSinceInception: Perquintill | null
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
        yieldSinceInception: trancheTokenPrices[trancheId].yieldSinceInception,
        chainId: portfolioData[trancheId]?.chainId,
      }
    }, [] as PortfolioToken[])
  }

  return []
}
