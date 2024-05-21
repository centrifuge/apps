import { AssetTransaction, CurrencyBalance, ExternalPricingInfo, Pool } from '@centrifuge/centrifuge-js'
import Decimal from 'decimal.js-light'
import React from 'react'
import { LabelValueStack } from '../../components/LabelValueStack'
import { Dec } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'

type Props = {
  pool: Pool
  transactions?: AssetTransaction[] | null
  currentFace: Decimal | null
  pricing: ExternalPricingInfo
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

  const averageSettlePrice = React.useMemo(() => {
    if (!transactions?.length) return Dec(0)

    const weightedSum = transactions.reduce((sum, trx) => {
      if (trx.settlementPrice && trx.amount) {
        return sum.add(
          new CurrencyBalance(trx.settlementPrice, pool.currency.decimals).toDecimal().mul(trx.amount.toDecimal())
        )
      }

      return sum
    }, Dec(0))

    const sumOfAmounts = transactions.reduce(
      (sum, trx) =>
        sum.add(
          trx.settlementPrice && trx.amount
            ? new CurrencyBalance(trx.amount, pool.currency.decimals).toDecimal()
            : Dec(0)
        ),
      Dec(0)
    )

    return weightedSum.div(sumOfAmounts)
  }, [transactions])

  return (
    <>
      <LabelValueStack
        label="Current face"
        value={currentFace ? `${formatBalance(currentFace, pool.currency.symbol, 2, 2)}` : '-'}
      />
      <LabelValueStack label="Net spent" value={`${formatBalance(netSpent, pool.currency.symbol, 2, 2)}`} />
      <LabelValueStack
        label="Average settle price"
        value={averageSettlePrice.isZero() ? '-' : `${formatBalance(averageSettlePrice, pool.currency.symbol, 2, 2)}`}
      />
      <LabelValueStack label="Notional" value={`${formatBalance(pricing.notional, pool.currency.symbol, 2, 2)}`} />
      <LabelValueStack label="Quantity" value={`${formatBalance(pricing.outstandingQuantity, undefined, 2, 0)}`} />
    </>
  )
}
