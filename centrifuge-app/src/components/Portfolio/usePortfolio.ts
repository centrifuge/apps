import {
  CurrencyBalance,
  CurrencyMetadata,
  InvestorTransactionType,
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

export function useDailyPortfolioValue(address: string, rangeValue: number) {
  const transactions = useTransactionsByAddress(address)

  const transactionsByTrancheId = transactions?.investorTransactions.reduce(
    (tranches, tranche) => ({
      ...tranches,
      [tranche.trancheId]: [...(tranches[tranche.trancheId] || []), tranche],
    }),
    {} as Record<string, InvestorTransaction[]>
  )

  const dailyTrancheStatesByTrancheId = useDailyTranchesStates(Object.keys(transactionsByTrancheId || {}))

  return useMemo(() => {
    if (dailyTrancheStatesByTrancheId && transactionsByTrancheId) {
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
  }, [dailyTrancheStatesByTrancheId, rangeValue, transactionsByTrancheId])
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
  // const [result] = useCentrifugeQuery(['accountPortfolio', address], (cent) => cent.pools.getPortfolio([address!]), {
  //   enabled: !!address,
  // })
  // return result

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
    }
  }`,
    {
      account: address && addressToHex(address),
    },
    {
      enabled: !!address,
    }
  )

  const data = useMemo(() => {
    return (
      (subData as undefined | {}) &&
      (Object.fromEntries(
        subData.account.trancheBalances.nodes.map((tranche: any) => {
          const decimals = tranche.pool.currency.decimals
          const tokenPrice = new Price(tranche.tranche.tokenPrice)
          let freeTrancheTokens = new CurrencyBalance(0, decimals)

          const claimableCurrency = new CurrencyBalance(tranche.claimableCurrency, decimals)
          const claimableTrancheTokens = new TokenBalance(tranche.claimableTrancheTokens, decimals)
          const pendingInvestCurrency = new CurrencyBalance(tranche.pendingInvestCurrency, decimals)
          const pendingRedeemTrancheTokens = new TokenBalance(tranche.pendingRedeemTrancheTokens, decimals)
          const sumClaimedCurrency = new CurrencyBalance(tranche.sumClaimedCurrency, decimals)
          const sumClaimedTrancheTokens = new TokenBalance(tranche.sumClaimedTrancheTokens, decimals)

          const currencyAmount = subData.account.currencyBalances.nodes.find(
            (b: any) => b.currency.trancheId && b.currency.trancheId === tranche.trancheId
          )
          if (currencyAmount) {
            freeTrancheTokens = new CurrencyBalance(currencyAmount.amount, decimals)
          }

          const totalTrancheTokens = new CurrencyBalance(
            new BN(tranche.claimableTrancheTokens)
              .add(new BN(tranche.pendingRedeemTrancheTokens))
              .add(freeTrancheTokens),
            decimals
          )

          return [
            tranche.trancheId.split('-')[1],
            {
              claimableCurrency,
              claimableTrancheTokens,
              pendingInvestCurrency,
              pendingRedeemTrancheTokens,
              sumClaimedCurrency,
              sumClaimedTrancheTokens,
              totalTrancheTokens,
              freeTrancheTokens,
              tokenPrice,
            },
          ]
        })
      ) as Record<
        string,
        {
          claimableCurrency: CurrencyBalance
          claimableTrancheTokens: TokenBalance
          pendingInvestCurrency: CurrencyBalance
          pendingRedeemTrancheTokens: TokenBalance
          sumClaimedCurrency: CurrencyBalance
          sumClaimedTrancheTokens: TokenBalance
          totalTrancheTokens: TokenBalance
          freeTrancheTokens: TokenBalance
          tokenPrice: Price
          // TODO: add reservedTrancheTokens
        }
      >)
    )
  }, [subData])

  return data
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
      }
    }, [] as PortfolioToken[])
  }

  return []
}
