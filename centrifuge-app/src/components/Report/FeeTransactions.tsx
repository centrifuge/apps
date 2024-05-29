import { Pool } from '@centrifuge/centrifuge-js'
import { Text } from '@centrifuge/fabric'
import * as React from 'react'
import { formatDate } from '../../utils/date'
import { formatBalance } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { useFeeTransactions, usePoolMetadata } from '../../utils/usePools'
import { DataTable } from '../DataTable'
import { Spinner } from '../Spinner'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'
import type { TableDataRow } from './index'
import { formatPoolFeeTransactionType } from './utils'

const noop = (v: any) => v

export function FeeTransactions({ pool }: { pool: Pool }) {
  const { startDate, endDate, setCsvData, txType } = React.useContext(ReportContext)
  const transactions = useFeeTransactions(pool.id, new Date(startDate), new Date(endDate))
  const { data: poolMetadata } = usePoolMetadata(pool)

  const columnConfig = [
    {
      header: 'Date',
      align: 'left',
      csvOnly: false,
      formatter: formatDate,
    },
    {
      header: 'Fee name',
      align: 'left',
      csvOnly: false,
      formatter: noop,
    },
    {
      header: 'Transaction type',
      align: 'left',
      csvOnly: false,
      formatter: noop,
    },
    {
      header: 'Currency amount',
      align: 'right',
      csvOnly: false,
      formatter: (v: any) => (typeof v === 'number' ? formatBalance(v, pool.currency.symbol, 5) : '-'),
    },
    {
      header: 'Currency',
      align: 'left',
      csvOnly: true,
      formatter: noop,
    },
  ]

  const data: TableDataRow[] = React.useMemo(() => {
    if (!transactions) {
      return []
    }

    return transactions
      ?.filter((tx) => tx.type !== 'PROPOSED' && tx.type !== 'ADDED' && tx.type !== 'REMOVED')
      .filter((tx) => (!txType || txType === 'all' ? true : tx.type === txType))
      .map((tx) => ({
        name: '',
        value: [
          tx.timestamp.toISOString(),
          poolMetadata?.pool?.poolFees?.find((f) => f.id === tx.poolFee.feeId)?.name || '-',
          formatPoolFeeTransactionType(tx.type),
          tx.amount?.toFloat() ?? '-',
          pool.currency.symbol,
        ],
        heading: false,
      }))
  }, [transactions, txType, poolMetadata, pool.currency.symbol])

  const columns = columnConfig
    .map((col, index) => ({
      align: col.align,
      header: col.header,
      cell: (row: TableDataRow) => <Text variant="body3">{col.formatter((row.value as any)[index])}</Text>,
      csvOnly: col.csvOnly,
    }))
    .filter((col) => !col.csvOnly)

  React.useEffect(() => {
    if (!data.length) {
      return
    }

    const formatted = data.map(({ value: values }) =>
      Object.fromEntries(columnConfig.map((col, index) => [col.header, `"${values[index]}"`]))
    )
    const dataUrl = getCSVDownloadUrl(formatted)

    setCsvData({
      dataUrl,
      fileName: `${pool.id}-fee-transactions-${formatDate(startDate, {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }).replaceAll(',', '')}-${formatDate(endDate, {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }).replaceAll(',', '')}.csv`,
    })

    return () => {
      setCsvData(undefined)
      URL.revokeObjectURL(dataUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  if (!transactions) {
    return <Spinner mt={2} />
  }

  return data.length > 0 ? (
    <DataTable data={data} columns={columns} hoverable />
  ) : (
    <UserFeedback reportType="Fee transactions" />
  )
}
