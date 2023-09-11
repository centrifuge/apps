import { BorrowerTransaction, CurrencyBalance, ExternalPricingInfo, Loan, Pool } from '@centrifuge/centrifuge-js'
import BN from 'bn.js'
import { LabelValueStack } from '../../components/LabelValueStack'
import { formatBalance } from '../../utils/formatting'

type Props = {
  loan: Loan & { pricing: ExternalPricingInfo }
  pool: Pool
  transactions?: BorrowerTransaction[] | null
}

export function HoldingsValues({ loan: { pricing }, pool, transactions }: Props) {
  const currentHolding =
    transactions?.reduce((sum, trx) => {
      if (trx.type === 'REPAID') {
        sum = new CurrencyBalance(
          sum.sub(
            trx.amount && trx.settlementPrice ? trx.amount.mul(new BN(trx.settlementPrice)) : new CurrencyBalance(0, 27)
          ),
          27
        )
      }

      if (trx.type === 'BORROWED') {
        sum = new CurrencyBalance(
          sum.add(
            trx.amount && trx.settlementPrice ? trx.amount.mul(new BN(trx.settlementPrice)) : new CurrencyBalance(0, 27)
          ),
          27
        )
      }

      return sum
    }, new CurrencyBalance(0, 27)) || new CurrencyBalance(0, 27)

  const currentTotalFace =
    transactions?.reduce((sum, trx) => {
      if (trx.type === 'BORROWED') {
        sum = new CurrencyBalance(sum.add(trx.amount || new CurrencyBalance(0, 27)), 27)
      }
      if (trx.type === 'REPAID') {
        sum = new CurrencyBalance(sum.sub(trx.amount || new CurrencyBalance(0, 27)), 27)
      }
      return sum
    }, new CurrencyBalance(0, 27)) || new CurrencyBalance(0, 27)

  return (
    <>
      <LabelValueStack
        label="Current total face"
        value={`${formatBalance(new CurrencyBalance(currentTotalFace, 24), pool.currency.symbol, 6, 2)}`}
      />
      <LabelValueStack
        label="Current holding"
        value={`${formatBalance(new CurrencyBalance(currentHolding, 32), pool.currency.symbol, 6, 2)}`}
      />
      <LabelValueStack
        label="Average price"
        value={`${formatBalance(
          new CurrencyBalance(currentHolding.div(currentTotalFace), 6),
          pool.currency.symbol,
          2,
          2
        )}`}
      />
      <LabelValueStack
        label="Current value"
        value={`${formatBalance(
          new CurrencyBalance(currentTotalFace.mul(pricing.oracle.value), 44),
          pool.currency.symbol,
          6,
          2
        )}`}
      />
    </>
  )
}
