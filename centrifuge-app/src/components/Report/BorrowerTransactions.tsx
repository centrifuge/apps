import { Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Text } from '@centrifuge/fabric'
import * as React from 'react'
import { formatDate } from '../../utils/date'
import { formatBalance } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { useBorrowerTransactions } from '../../utils/usePools'
import { DataTable } from '../DataTable'
import type { TableDataRow } from './index'
import { ReportContext } from './ReportContext'
import { formatBorrowerTransactionsType } from './utils'

export function BorrowerTransactions({ pool }: { pool: Pool }) {
  const { startDate, endDate, setCsvData } = React.useContext(ReportContext)
  const transactions = useBorrowerTransactions(pool.id, startDate, endDate)

  const data: TableDataRow[] = React.useMemo(() => {
    if (!transactions) {
      return []
    }

    return transactions?.map((tx) => ({
      name: '',
      value: [
        tx.loanId.split('-').at(-1)!,
        tx.epochId.split('-').at(-1)!,
        formatDate(tx.timestamp.toString()),
        formatBorrowerTransactionsType(tx.type),
        tx.amount ? `${pool.currency} ${formatBalance(tx.amount)}` : '-',
      ],
      heading: false,
    }))
  }, [transactions])

  const headers = ['Asset ID', 'Epoch', 'Date', 'Type', 'Token amount']

  const columns = headers.map((col, index) => ({
    align: 'left',
    header: col,
    cell: (row: TableDataRow) => <Text variant="body2">{(row.value as any)[index]}</Text>,
    flex: index === 0 ? '0 0 150px' : index === 4 ? '0 0 200px' : '1',
  }))

  const dataUrl = React.useMemo(() => {
    if (!data.length) {
      return
    }

    const formatted = data
      .map(({ value }) => value as string[])
      .map((values) => Object.fromEntries(headers.map((_, index) => [headers[index], `"${values[index]}"`])))

    return getCSVDownloadUrl(formatted)
  }, [data])

  React.useEffect(() => {
    setCsvData(
      dataUrl
        ? {
            dataUrl,
            fileName: `${pool.id}-borrower-transactions-${startDate}-${endDate}.csv`,
          }
        : undefined
    )

    return () => setCsvData(undefined)
  }, [dataUrl])

  return <DataTable data={data} columns={columns} hoverable rounded={false} />
}
