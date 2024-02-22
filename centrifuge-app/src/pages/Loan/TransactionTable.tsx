import { AssetTransaction, CurrencyBalance, ExternalPricingInfo, PricingInfo } from '@centrifuge/centrifuge-js'
import { AssetTransactionType } from '@centrifuge/centrifuge-js/dist/types/subquery'
import { StatusChip, Tooltip } from '@centrifuge/fabric'
import BN from 'bn.js'
import { useMemo } from 'react'
import { DataTable } from '../../components/DataTable'
import { formatDate } from '../../utils/date'
import { Dec } from '../../utils/Decimal'
import { formatBalance } from '../../utils/formatting'

type Props = {
  transactions: AssetTransaction[]
  currency: string
  decimals: number
  loanType: 'external' | 'internal'
  pricing: PricingInfo
}

export const TransactionTable = ({ transactions, currency, loanType, decimals, pricing }: Props) => {
  const assetTransactions = useMemo(() => {
    const sortedTransactions = transactions.sort((a, b) => {
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

    return sortedTransactions.map((transaction, index, array) => ({
      type: transaction.type,
      amount: transaction.amount,
      quantity: transaction.quantity ? new CurrencyBalance(transaction.quantity, 18) : null,
      transactionDate: transaction.timestamp,
      settlePrice: transaction.settlementPrice
        ? new CurrencyBalance(new BN(transaction.settlementPrice), decimals)
        : null,
      faceFlow:
        transaction.quantity && (pricing as ExternalPricingInfo).notional
          ? new CurrencyBalance(transaction.quantity, 18)
              .toDecimal()
              .mul((pricing as ExternalPricingInfo).notional.toDecimal())
          : null,
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
    }))
  }, [transactions, decimals, pricing])

  const getStatusChipType = (type: AssetTransactionType) => {
    if (type === 'BORROWED' || type === 'CREATED' || type === 'PRICED') return 'info'
    if (type === 'REPAID') return 'ok'
    return 'default'
  }

  const getStatusText = (type: AssetTransactionType) => {
    if (loanType === 'external' && type === 'BORROWED') return 'Purchase'
    if (loanType === 'external' && type === 'REPAID') return 'Sale'

    if (loanType === 'internal' && type === 'BORROWED') return 'Financed'
    if (loanType === 'internal' && type === 'REPAID') return 'Repaid'

    return `${type[0]}${type.slice(1).toLowerCase()}`
  }

  return (
    <DataTable
      data={assetTransactions.reverse()}
      columns={[
        {
          align: 'left',
          header: 'Type',
          cell: (row: { type: AssetTransactionType }) => (
            <StatusChip status={getStatusChipType(row.type)}>{getStatusText(row.type)}</StatusChip>
          ),
        },
        {
          align: 'left',
          header: 'Transaction date',
          cell: (row) => (
            <Tooltip
              title="Transaction date"
              body={formatDate(row.transactionDate, { hour: 'numeric', minute: 'numeric', second: 'numeric' })}
            >
              {formatDate(row.transactionDate)}
            </Tooltip>
          ),
        },

        {
          align: 'left',
          header: 'Face flow',
          cell: (row) =>
            row.faceFlow ? `${row.type === 'REPAID' ? '-' : ''}${formatBalance(row.faceFlow, currency, 2, 2)}` : '-',
        },
        {
          align: 'left',
          header: 'Quantity',
          cell: (row) => (row.quantity ? formatBalance(row.quantity, undefined, 2, 0) : '-'),
        },
        {
          align: 'left',
          header: 'Settle price',
          cell: (row) => (row.settlePrice ? formatBalance(row.settlePrice, currency, 6, 2) : '-'),
        },
        {
          align: 'left',
          header: 'Net cash flow',
          cell: (row) =>
            row.amount ? `${row.type === 'BORROWED' ? '-' : ''}${formatBalance(row.amount, currency, 2, 2)}` : '-',
        },
        {
          align: 'left',
          header: 'Position',
          cell: (row) => (row.type === 'CREATED' ? '-' : formatBalance(row.position, currency, 2, 2)),
        },
        // TODO: add link to transaction
        // {
        //   align: 'right',
        //   header: '',
        //   cell: () => (
        //     <IconAnchor href={''} target="_blank" rel="noopener noreferrer">
        //        <IconExternalLink />
        //     </IconAnchor>
        //   ),
        // },
      ]}
    />
  )
}
