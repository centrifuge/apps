import { Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Text } from '@centrifuge/fabric'
import * as React from 'react'
import { formatDate } from '../../utils/date'
import { formatBalanceAbbreviated } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { useAssetTransactions } from '../../utils/usePools'
import { DataTable } from '../DataTable'
import { Spinner } from '../Spinner'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'
import type { TableDataRow } from './index'
import { formatAssetTransactionType } from './utils'

export function AssetTransactions({ pool }: { pool: Pool }) {
  const { startDate, endDate, setCsvData } = React.useContext(ReportContext)
  const transactions = useAssetTransactions(pool.id, startDate, endDate)

  const headers = ['Asset ID', 'Epoch', 'Date', 'Type', `${pool ? `${pool.currency.symbol} amount` : '—'}`]

  const data: TableDataRow[] = React.useMemo(() => {
    if (!transactions) {
      return []
    }

    return transactions?.map((tx) => ({
      name: '',
      value: [
        tx.asset.id.split('-').at(-1)!,
        tx.epochId.split('-').at(-1)!,
        formatDate(tx.timestamp.toString()),
        formatAssetTransactionType(tx.type),
        tx.amount ? formatBalanceAbbreviated(tx.amount, pool.currency.symbol) : '-',
      ],
      heading: false,
    }))
  }, [transactions, pool.currency.symbol])

  const columns = headers.map((col, index) => ({
    align: 'left',
    header: col,
    cell: (row: TableDataRow) => <Text variant="body2">{(row.value as any)[index]}</Text>,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataUrl, startDate, endDate, pool.id])

  if (!transactions) {
    return <Spinner mt={2} />
  }

  return data.length > 0 ? (
    <DataTable data={data} columns={columns} hoverable />
  ) : (
    <UserFeedback reportType="Borrower transactions" />
  )
}
