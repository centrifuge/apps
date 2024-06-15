import { AssetTransaction, CurrencyBalance, ExternalPricingInfo, Pool } from '@centrifuge/centrifuge-js'
import { Card, Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import React from 'react'
import { Dec } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'
import { MetricsTable } from './MetricsTable'

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

  const metrics = [
    ...[
      pricing.notional.gtn(0)
        ? {
            label: 'Current face',
            value: currentFace ? `${formatBalance(currentFace, pool.currency.symbol, 2, 2)}` : '-',
          }
        : null,
    ],
    { label: 'Net spent', value: `${formatBalance(netSpent, pool.currency.symbol, 2, 2)}` },
    {
      label: 'Average purchase price',
      value: averageSettlePrice.isZero() ? '-' : `${formatBalance(averageSettlePrice, pool.currency.symbol, 2, 2)}`,
    },
    ...[
      pricing.notional.gtn(0)
        ? { label: 'Notional', value: `${formatBalance(pricing.notional, pool.currency.symbol, 2, 2)}` }
        : null,
    ],
    { label: 'Quantity', value: `${formatBalance(pricing.outstandingQuantity, undefined, 2, 0)}` },
  ]

  return (
    <Card p={3}>
      <Stack gap={2}>
        <Text fontSize="18px" fontWeight="500">
          Holdings
        </Text>
        <MetricsTable metrics={metrics} />
      </Stack>
    </Card>
  )
}
