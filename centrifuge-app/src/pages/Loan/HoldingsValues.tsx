import { BorrowerTransaction, CurrencyBalance, Pool } from '@centrifuge/centrifuge-js'
import BN from 'bn.js'
import { LabelValueStack } from '../../components/LabelValueStack'
import { Dec } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'

type Props = {
  pool: Pool
  transactions?: BorrowerTransaction[] | null
}

export function HoldingsValues({ pool, transactions }: Props) {
  const netSpent =
    transactions?.reduce((sum, trx) => {
      if (trx.type === 'REPAID') {
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

      if (trx.type === 'BORROWED') {
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

      return sum
    }, new CurrencyBalance(0, pool.currency.decimals)) || new CurrencyBalance(0, pool.currency.decimals)

  const currentFace =
    transactions?.reduce((sum, trx) => {
      if (trx.type === 'BORROWED') {
        sum = new CurrencyBalance(
          sum.add(trx.amount ? new BN(trx.amount).mul(new BN(100)) : new CurrencyBalance(0, pool.currency.decimals)),
          pool.currency.decimals
        )
      }
      if (trx.type === 'REPAID') {
        sum = new CurrencyBalance(
          sum.sub(trx.amount ? new BN(trx.amount).mul(new BN(100)) : new CurrencyBalance(0, pool.currency.decimals)),
          pool.currency.decimals
        )
      }
      return sum
    }, new CurrencyBalance(0, pool.currency.decimals)) || new CurrencyBalance(0, pool.currency.decimals)

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
          netSpent.isZero()
            ? '-'
            : `${formatBalance(
                Dec(netSpent.toNumber()).div(Dec(currentFace.toNumber())).mul(100),
                pool.currency.symbol,
                2,
                2
              )}`
        }
      />
    </>
  )
}
