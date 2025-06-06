import { Pool } from '@centrifuge/centrifuge-js'
import { Box, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { formatDate } from '../../utils/date'
import { formatBalance } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { usePoolMetadata } from '../../utils/usePools'
import { DataTable } from '../DataTable'
import { Spinner } from '../Spinner'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'
import type { TableDataRow } from './index'
import { useReport } from './useReportsQuery'
import { formatPoolFeeTransactionType } from './utils'

const noop = (v: any) => v

export function FeeTransactions({ pool }: { pool: Pool }) {
  const { startDate, endDate, setCsvData, txType } = React.useContext(ReportContext)
  const { data: poolMetadata } = usePoolMetadata(pool)

  const { data: transactions = [], isLoading } = useReport(
    'feeTransactions',
    pool,
    new Date(startDate),
    new Date(endDate),
    undefined,
    {
      ...(txType !== 'all' && { transactionType: txType.toLowerCase() }),
    }
  )

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
      align: 'left',
      csvOnly: false,
      formatter: (v: any) => (typeof v === 'number' ? formatBalance(v, pool.currency.symbol, 2) : '-'),
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

    return transactions.map((tx) => ({
      name: '',
      value: [
        tx.timestamp,
        poolMetadata?.pool?.poolFees?.find((f) => f.id === Number(tx.feeId))?.name || '-',
        formatPoolFeeTransactionType(tx.transactionType),
        tx.amount?.toFloat() ?? '-',
        pool.currency.symbol,
      ],
      heading: false,
    }))
  }, [transactions, poolMetadata, pool.currency.symbol])

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

    if (!dataUrl) {
      throw new Error('Failed to generate CSV')
    }

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

  if (isLoading) {
    return <Spinner />
  }

  return data.length > 0 ? (
    <Box>
      <DataTable data={data} columns={columns} hoverable scrollable defaultSortKey="value[0]" defaultSortOrder="desc" />
    </Box>
  ) : (
    <UserFeedback reportType="Fee transactions" />
  )
}
