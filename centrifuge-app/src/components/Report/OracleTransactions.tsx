import { Pool } from '@centrifuge/centrifuge-js'
import { Box, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { formatDate } from '../../utils/date'
import { formatBalance } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { useOracleTransactions } from '../../utils/usePools'
import { DataTable } from '../DataTable'
import { Spinner } from '../Spinner'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'
import type { TableDataRow } from './index'

const noop = (v: any) => v

export function OracleTransactions({ pool }: { pool: Pool }) {
  const { startDate, endDate, setCsvData } = React.useContext(ReportContext)
  const transactions = useOracleTransactions(new Date(startDate), new Date(endDate))

  const columnConfig = [
    {
      header: 'Date',
      align: 'left',
      csvOnly: false,
      formatter: formatDate,
    },
    {
      header: 'Oracle key',
      align: 'left',
      csvOnly: false,
      formatter: noop,
    },
    {
      header: 'Value',
      align: 'right',
      csvOnly: false,
      formatter: (v: any) => (typeof v === 'number' ? formatBalance(v, pool.currency.symbol, 2) : '-'),
    },
  ]

  const data: TableDataRow[] =
    transactions?.map((tx) => ({
      name: '',
      value: [tx.timestamp.toISOString(), tx.key?.substring(2) || '-', tx.value?.toFloat() ?? '-'],
      heading: false,
    })) || []

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
      throw new Error('Failed to create CSV')
    }

    setCsvData({
      dataUrl,
      fileName: `${pool.id}-oracle-transactions-${formatDate(startDate, {
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
    <Box paddingX={2}>
      <DataTable data={data} columns={columns} hoverable scrollable />
    </Box>
  ) : (
    <UserFeedback reportType="Oracle transactions" />
  )
}
