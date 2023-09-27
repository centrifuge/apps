import { BorrowerTransaction, CurrencyBalance, ExternalPricingInfo, PricingInfo } from '@centrifuge/centrifuge-js'
import { BorrowerTransactionType } from '@centrifuge/centrifuge-js/dist/types/subquery'
import { StatusChip, Tooltip } from '@centrifuge/fabric'
import BN from 'bn.js'
import { useMemo } from 'react'
import { DataTable } from '../../components/DataTable'
import { formatDate } from '../../utils/date'
import { formatBalance } from '../../utils/formatting'

type Props = {
  transactions: BorrowerTransaction[]
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
      transactionDate: transaction.timestamp,
      settlePrice: transaction.settlementPrice
        ? new CurrencyBalance(new BN(transaction.settlementPrice).mul(new BN(100)), decimals)
        : null,
      faceFlow:
        transaction.quantity && (pricing as ExternalPricingInfo).notional
          ? new CurrencyBalance(
              new BN(transaction.quantity)
                .mul((pricing as ExternalPricingInfo).notional)
                .div(new BN(10).pow(new BN(18))),
              18
            )
          : null,
      position: array.slice(0, index + 1).reduce((sum, trx) => {
        if (trx.type === 'BORROWED') {
          sum = new CurrencyBalance(
            sum.add(
              trx.quantity
                ? new CurrencyBalance(
                    new BN(trx.quantity).mul((pricing as ExternalPricingInfo).notional).div(new BN(10).pow(new BN(18))),
                    18
                  )
                : new CurrencyBalance(0, decimals)
            ),
            decimals
          )
        }
        if (trx.type === 'REPAID') {
          sum = new CurrencyBalance(
            sum.sub(
              trx.quantity
                ? new CurrencyBalance(
                    new BN(trx.quantity).mul((pricing as ExternalPricingInfo).notional).div(new BN(10).pow(new BN(18))),
                    18
                  )
                : new CurrencyBalance(0, decimals)
            ),
            decimals
          )
        }
        return sum
      }, new CurrencyBalance(0, 18)),
    }))
  }, [transactions, decimals, pricing])

  const getStatusChipType = (type: BorrowerTransactionType) => {
    if (type === 'BORROWED' || type === 'CREATED' || type === 'PRICED') return 'info'
    if (type === 'REPAID') return 'ok'
    return 'default'
  }

  const getStatusText = (type: BorrowerTransactionType) => {
    if (loanType === 'external' && type === 'BORROWED') return 'Purchase'
    if (loanType === 'external' && type === 'REPAID') return 'Sale'

    return `${type[0]}${type.slice(1).toLowerCase()}`
  }

  return (
    <DataTable
      data={assetTransactions.reverse()}
      columns={[
        {
          align: 'left',
          header: 'Type',
          cell: (row: { type: BorrowerTransactionType }) => (
            <StatusChip status={getStatusChipType(row.type)}>{getStatusText(row.type)}</StatusChip>
          ),
          flex: '3',
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
          flex: '3',
        },

        {
          align: 'left',
          header: 'Face flow',
          cell: (row) =>
            row.faceFlow ? `${row.type === 'REPAID' ? '-' : ''}${formatBalance(row.faceFlow, currency, 2, 2)}` : '-',
          flex: '3',
        },
        {
          align: 'left',
          header: 'Settle price',
          cell: (row) => (row.settlePrice ? formatBalance(row.settlePrice, currency, 6, 2) : '-'),
          flex: '3',
        },
        {
          align: 'left',
          header: 'Net cash flow',
          cell: (row) =>
            row.faceFlow && row.settlePrice
              ? `${row.type === 'BORROWED' ? '-' : ''}${formatBalance(
                  row.faceFlow.toDecimal().mul(new CurrencyBalance(row.settlePrice, decimals).toDecimal().div(100)),
                  currency,
                  2,
                  2
                )}`
              : '-',
          flex: '3',
        },
        {
          align: 'left',
          header: 'Position',
          cell: (row) =>
            row.type === 'CREATED' ? '-' : formatBalance(new CurrencyBalance(row.position, 18), currency, 2, 2),
          flex: '3',
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
        //   flex: '3',
        // },
      ]}
    />
  )
}
