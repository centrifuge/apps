import { BorrowerTransaction, CurrencyBalance, Pool } from '@centrifuge/centrifuge-js'
import BN from 'bn.js'
import { LabelValueStack } from '../../components/LabelValueStack'
import { formatBalance } from '../../utils/formatting'

type Props = {
  pool: Pool
  transactions?: BorrowerTransaction[] | null
  currentFace: CurrencyBalance
}

export function HoldingsValues({ pool, transactions, currentFace }: Props) {
  const netSpent =
    transactions?.reduce((sum, trx) => {
      if (trx.type === 'REPAID') {
        sum = new CurrencyBalance(
          sum.add(
            trx.amount && trx.settlementPrice
              ? new BN(trx.amount.mul(new BN(trx.settlementPrice).mul(new BN(100)))).div(
                  new BN(10).pow(new BN(pool.currency.decimals))
                )
              : new CurrencyBalance(0, pool.currency.decimals)
          ),
          pool.currency.decimals
        )
      }

      if (trx.type === 'BORROWED') {
        sum = new CurrencyBalance(
          sum.sub(
            trx.amount && trx.settlementPrice
              ? new BN(trx.amount.mul(new BN(trx.settlementPrice).mul(new BN(100)))).div(
                  new BN(10).pow(new BN(pool.currency.decimals))
                )
              : new CurrencyBalance(0, pool.currency.decimals)
          ),
          pool.currency.decimals
        )
      }

      return sum
    }, new CurrencyBalance(0, pool.currency.decimals)) || new CurrencyBalance(0, pool.currency.decimals)

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
        value={`${formatBalance(new CurrencyBalance(currentFace, pool.currency.decimals), pool.currency.symbol, 2, 2)}`}
      />
      <LabelValueStack
        label="Net spent"
        value={`${formatBalance(new CurrencyBalance(netSpent, pool.currency.decimals), pool.currency.symbol, 2, 2)}`} // fixdis
      />
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
