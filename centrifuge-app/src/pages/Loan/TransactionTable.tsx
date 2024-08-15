import { AssetTransaction, CurrencyBalance, ExternalPricingInfo, PricingInfo } from '@centrifuge/centrifuge-js'
import { AssetTransactionType } from '@centrifuge/centrifuge-js/dist/types/subquery'
import { StatusChip, Tooltip } from '@centrifuge/fabric'
import BN from 'bn.js'
import Decimal from 'decimal.js-light'
import { useMemo } from 'react'
import { Column, DataTable } from '../../components/DataTable'
import { Tooltips } from '../../components/Tooltips'
import { Dec } from '../../utils/Decimal'
import { daysBetween, formatDate } from '../../utils/date'
import { formatBalance, formatPercentage } from '../../utils/formatting'

type Props = {
  transactions: AssetTransaction[]
  currency: string
  decimals: number
  loanType: 'external' | 'internal'
  pricing: PricingInfo
  poolType?: string
  maturityDate?: Date
  originationDate: Date | undefined
}

type Row = {
  type: AssetTransactionType
  amount: CurrencyBalance | undefined
  quantity: CurrencyBalance | null
  transactionDate: string
  settlePrice: CurrencyBalance | null
  faceValue: Decimal | null
  position: Decimal
  yieldToMaturity: Decimal | null
  realizedProfitFifo: CurrencyBalance | null
}

export const TransactionTable = ({
  transactions,
  currency,
  loanType,
  decimals,
  pricing,
  poolType,
  maturityDate,
}: Props) => {
  const assetTransactions = useMemo(() => {
    const sortedTransactions = transactions?.sort((a, b) => {
      if (a.timestamp > b.timestamp) {
        return 1
      }

      if (a.timestamp < b.timestamp) {
        return -1
      }

      if (a.type === 'CLOSED' || b.type === 'CLOSED') {
        return -1
      }

      return 0
    })

    return sortedTransactions
      ?.filter((transaction) => {
        return !transaction.amount?.isZero()
      })
      ?.map((transaction, index, array) => {
        const termDays = maturityDate
          ? transaction.timestamp
            ? daysBetween(transaction.timestamp, maturityDate)
            : daysBetween(new Date(), maturityDate)
          : 0

        const faceValue =
          transaction.quantity && (pricing as ExternalPricingInfo).notional
            ? new CurrencyBalance(transaction.quantity, 18)
                .toDecimal()
                .mul((pricing as ExternalPricingInfo).notional.toDecimal())
            : null

        return {
          type: transaction.type,
          amount: transaction.amount,
          quantity: transaction.quantity ? new CurrencyBalance(transaction.quantity, 18) : null,
          transactionDate: transaction.timestamp,
          yieldToMaturity:
            transaction.amount && maturityDate && faceValue && transaction.type !== 'REPAID' && termDays > 0
              ? faceValue
                  ?.sub(transaction.amount.toDecimal())
                  .div(transaction.amount.toDecimal())
                  .mul(Dec(365).div(Dec(termDays)))
                  .mul(100)
              : null,
          settlePrice: transaction.settlementPrice
            ? new CurrencyBalance(new BN(transaction.settlementPrice), decimals)
            : null,
          faceValue,
          position: array.slice(0, index + 1).reduce((sum, trx) => {
            if (trx.type === 'BORROWED') {
              sum = sum.add(
                trx.quantity
                  ? new CurrencyBalance(trx.quantity, 18)
                      .toDecimal()
                      .mul((pricing as ExternalPricingInfo).notional.toDecimal())
                  : trx.amount
                  ? trx.amount.toDecimal()
                  : Dec(0)
              )
            }
            if (trx.type === 'REPAID') {
              sum = sum.sub(
                trx.quantity
                  ? new CurrencyBalance(trx.quantity, 18)
                      .toDecimal()
                      .mul((pricing as ExternalPricingInfo).notional.toDecimal())
                  : trx.amount
                  ? trx.amount.toDecimal()
                  : Dec(0)
              )
            }
            return sum
          }, Dec(0)),
          realizedProfitFifo: transaction.realizedProfitFifo,
        }
      })
  }, [transactions, maturityDate, pricing, decimals])

  const getStatusChipType = (type: AssetTransactionType) => {
    if (type === 'BORROWED' || type === 'CREATED' || type === 'PRICED') return 'info'
    if (type === 'REPAID') return 'ok'
    return 'default'
  }

  const getStatusText = (type: AssetTransactionType) => {
    if (type === 'BORROWED') return 'Financed'
    if (type === 'REPAID') return 'Repaid'

    return `${type[0]}${type.slice(1).toLowerCase()}`
  }

  const columns = [
    {
      align: 'left',
      header: 'Type',
      cell: (row: Row) => <StatusChip status={getStatusChipType(row.type)}>{getStatusText(row.type)}</StatusChip>,
    },
    {
      align: 'left',
      header: 'Transaction date',
      cell: (row: Row) => (
        <Tooltip
          title="Transaction date"
          body={formatDate(row.transactionDate, { hour: 'numeric', minute: 'numeric', second: 'numeric' })}
        >
          {formatDate(row.transactionDate)}
        </Tooltip>
      ),
    },
    ...(poolType === 'Public credit'
      ? [
          {
            align: 'left',
            header: `Face value (${currency})`,
            cell: (row: Row) =>
              row.faceValue
                ? `${row.type === 'REPAID' ? '-' : ''}${formatBalance(row.faceValue, undefined, 2, 2)}`
                : '-',
          },
          {
            align: 'left',
            header: 'Quantity',
            cell: (row: Row) => (row.quantity ? formatBalance(row.quantity, undefined, 2, 0) : '-'),
          },
          {
            align: 'left',
            header: `Settle price (${currency})`,
            cell: (row: Row) => (row.settlePrice ? formatBalance(row.settlePrice, undefined, 6, 2) : '-'),
          },
          ...(loanType === 'external' && (pricing as ExternalPricingInfo).notional.gtn(0)
            ? [
                {
                  align: 'left',
                  header: <Tooltips type="ytm" />,
                  cell: (row: Row) =>
                    !row.yieldToMaturity || row.yieldToMaturity?.lt(0) ? '-' : formatPercentage(row.yieldToMaturity),
                },
              ]
            : []),
          {
            align: 'left',
            header: `Net cash flow (${currency})`,
            cell: (row: Row) =>
              row.amount ? `${row.type === 'BORROWED' ? '-' : ''}${formatBalance(row.amount, undefined, 2, 2)}` : '-',
          },
          {
            align: 'left',
            header: `Realized P&L`,
            cell: (row: Row) =>
              row.realizedProfitFifo
                ? `${row.type !== 'REPAID' ? '-' : ''}${formatBalance(row.realizedProfitFifo, undefined, 2, 2)}`
                : '-',
          },
          {
            align: 'left',
            header: `Position (${currency})`,
            cell: (row: Row) => (row.type === 'CREATED' ? '-' : formatBalance(row.position, undefined, 2, 2)),
          },
        ]
      : [
          {
            align: 'left',
            header: `Amount (${currency})`,
            cell: (row: Row) => (row.amount ? `${formatBalance(row.amount, undefined, 2, 2)}` : '-'),
          },
          {
            align: 'left',
            header: `Principal (${currency})`,
            cell: (row: Row) => (row.position ? `${formatBalance(row.position, undefined, 2, 2)}` : '-'),
          },
        ]),
  ] as Column[]

  return <DataTable data={assetTransactions.reverse()} columns={columns} />
}
