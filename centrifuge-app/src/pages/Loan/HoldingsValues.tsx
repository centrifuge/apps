import { BorrowerTransaction, CurrencyBalance, ExternalPricingInfo, Pool, PricingInfo } from '@centrifuge/centrifuge-js'
import BN from 'bn.js'
import { LabelValueStack } from '../../components/LabelValueStack'
import { formatBalance } from '../../utils/formatting'

type Props = {
  pool: Pool
  transactions?: BorrowerTransaction[] | null
  currentFace: CurrencyBalance | null
  pricing: PricingInfo
}

export function HoldingsValues({ pool, transactions, currentFace, pricing }: Props) {
  const netSpent =
    transactions?.reduce((sum, trx) => {
      if (trx.type === 'REPAID') {
        sum = new CurrencyBalance(
          sum.add(
            trx.quantity && trx.settlementPrice
              ? new CurrencyBalance(
                  new BN(trx.quantity)
                    .mul((pricing as ExternalPricingInfo).notional)
                    .mul(new BN(trx.settlementPrice))
                    .div(new BN(10).pow(new BN(18)))
                    .div(new BN(10).pow(new BN(6))),
                  18
                )
              : new CurrencyBalance(0, pool.currency.decimals)
          ),
          18
        )
      }

      if (trx.type === 'BORROWED') {
        sum = new CurrencyBalance(
          sum.sub(
            trx.quantity && trx.settlementPrice
              ? new CurrencyBalance(
                  new BN(trx.quantity)
                    .mul((pricing as ExternalPricingInfo).notional)
                    .mul(new BN(trx.settlementPrice))
                    .div(new BN(10).pow(new BN(18)))
                    .div(new BN(10).pow(new BN(6))),
                  18
                )
              : new CurrencyBalance(0, pool.currency.decimals)
          ),
          18
        )
      }

      return sum
    }, new CurrencyBalance(0, 18)) || new CurrencyBalance(0, 18)

  const getAverageSettlePrice = () => {
    const settlementTransactions =
      transactions?.reduce((sum, trx) => {
        if (!new BN(trx.settlementPrice || 0).isZero()) {
          sum = sum.add(new BN(1))
        }
        return sum
      }, new BN(0)) || new BN(0)

    if (settlementTransactions.isZero()) {
      return new CurrencyBalance(0, pool.currency.decimals)
    }

    return (
      transactions?.reduce((sum, trx) => {
        if (!new BN(trx.settlementPrice || 0).isZero()) {
          sum = new CurrencyBalance(
            sum.add(trx.settlementPrice ? new BN(trx.settlementPrice) : new CurrencyBalance(0, pool.currency.decimals)),
            pool.currency.decimals
          )
        }
        return sum
      }, new CurrencyBalance(0, pool.currency.decimals)) || new CurrencyBalance(0, pool.currency.decimals)
    ).div(settlementTransactions)
  }

  return (
    <>
      <LabelValueStack label="Current face" value={`${formatBalance(currentFace!, pool.currency.symbol, 2, 2)}`} />
      <LabelValueStack label="Net spent" value={`${formatBalance(netSpent, pool.currency.symbol, 2, 2)}`} />
      <LabelValueStack
        label="Average settle price"
        value={
          getAverageSettlePrice().isZero()
            ? '-'
            : `${formatBalance(
                new CurrencyBalance(getAverageSettlePrice().mul(new BN(100)), pool.currency.decimals),
                pool.currency.symbol,
                2,
                2
              )}`
        }
      />
    </>
  )
}
