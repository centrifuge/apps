import { BorrowerTransaction, CurrencyBalance } from '@centrifuge/centrifuge-js'
import { BorrowerTransactionType } from '@centrifuge/centrifuge-js/dist/types/subquery'
import { StatusChip } from '@centrifuge/fabric'
import { useMemo } from 'react'
import { DataTable } from '../../components/DataTable'
import { formatDate } from '../../utils/date'
import { formatBalance } from '../../utils/formatting'

type Props = {
  transactions: BorrowerTransaction[]
}

export const TransactionTable = ({ transactions }: Props) => {
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
      // settlePrice: TODO: add subquery query for fetching settle price
      netFlow: transaction.amount,
      position: array.slice(0, index + 1).reduce((sum, trx) => {
        if (trx.type === 'BORROWED') {
          sum = new CurrencyBalance(sum.add(trx.amount || new CurrencyBalance(0, 27)), 27)
        }
        if (trx.type === 'REPAID') {
          sum = new CurrencyBalance(sum.sub(trx.amount || new CurrencyBalance(0, 27)), 27)
        }
        return sum
      }, new CurrencyBalance(0, 27)),
    }))
  }, [transactions])

  const getStatusChipType = (type: BorrowerTransactionType) => {
    if (type === 'BORROWED' || type === 'CREATED' || type === 'PRICED') return 'info'
    if (type === 'REPAID') return 'ok'
    return 'default'
  }

  return (
    <DataTable
      data={assetTransactions.reverse()}
      columns={[
        {
          align: 'left',
          header: 'Type',
          cell: (row: { type: BorrowerTransactionType }) => (
            <StatusChip status={getStatusChipType(row.type)}>{`${row.type[0]}${row.type
              .slice(1)
              .toLowerCase()}`}</StatusChip>
          ),
          flex: '3',
        },
        {
          align: 'left',
          header: 'Transaction date',
          cell: (row) => formatDate(row.transactionDate),
          flex: '3',
        },
        // TODO: add subquery query for fetching settle price
        // {
        //   align: 'left',
        //   header: 'Settle price',
        //   cell: (row) => formatBalance(row.settlePrice, 'USD'),
        //   flex: '3',
        // },
        {
          align: 'left',
          header: 'Net flow',
          cell: (row) => (row.netFlow ? formatBalance(new CurrencyBalance(row.netFlow, 27), 'USD') : '-'),
          flex: '3',
        },
        {
          align: 'left',
          header: 'Position',
          cell: (row) => formatBalance(row.position, 'USD'),
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
