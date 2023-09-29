import { BorrowerTransaction, CurrencyBalance, ExternalPricingInfo, Pool, PricingInfo } from '@centrifuge/centrifuge-js'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import { LabelValueStack } from '../../components/LabelValueStack'
import { Dec } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'

type Props = {
  pool: Pool
  transactions?: BorrowerTransaction[] | null
  currentFace: Decimal | null
  pricing: PricingInfo
}

export function HoldingsValues({ pool, transactions, currentFace, pricing }: Props) {
  const netSpent =
    transactions?.reduce((sum, trx) => {
      if (trx.type === 'REPAID') {
        sum = trx.amount ? sum.add(trx.amount.toDecimal()) : sum
      }

      if (trx.type === 'BORROWED') {
        sum = trx.amount ? sum.sub(trx.amount.toDecimal()) : sum
      }

      return sum
    }, Dec(0)) || Dec(0)

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
      <LabelValueStack
        label="Current face"
        value={currentFace ? `${formatBalance(currentFace, pool.currency.symbol, 2, 2)}` : '-'}
      />
      <LabelValueStack label="Net spent" value={`${formatBalance(netSpent, pool.currency.symbol, 2, 2)}`} />
      <LabelValueStack
        label="Average settle price"
        value={
          getAverageSettlePrice().isZero()
            ? '-'
            : `${formatBalance(
                new CurrencyBalance(getAverageSettlePrice(), pool.currency.decimals),
                pool.currency.symbol,
                2,
                2
              )}`
        }
      />
      <LabelValueStack
        label="Notional"
        value={`${formatBalance((pricing as ExternalPricingInfo).notional, pool.currency.symbol, 2, 2)}`}
      />
      <LabelValueStack
        label="Quantity"
        value={`${formatBalance((pricing as ExternalPricingInfo).outstandingQuantity, undefined, 2, 0)}`}
      />
    </>
  )
}
