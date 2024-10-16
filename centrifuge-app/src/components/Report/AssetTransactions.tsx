import { Pool } from '@centrifuge/centrifuge-js'
import { formatBalance, useGetExplorerUrl } from '@centrifuge/centrifuge-react'
import { Box, IconAnchor, IconExternalLink, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { formatDate } from '../../utils/date'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { useAssetTransactions } from '../../utils/usePools'
import { DataTable } from '../DataTable'
import { Spinner } from '../Spinner'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'
import type { TableDataRow } from './index'
import { formatAssetTransactionType } from './utils'

const noop = (v: any) => v

export function AssetTransactions({ pool }: { pool: Pool }) {
  const { startDate, endDate, setCsvData, txType, loan: loanId } = React.useContext(ReportContext)
  const transactions = useAssetTransactions(pool.id, new Date(startDate), new Date(endDate))
  const explorer = useGetExplorerUrl('centrifuge')

  const columnConfig = [
    {
      header: 'Asset ID',
      align: 'left',
      csvOnly: false,
      formatter: noop,
    },
    {
      header: 'Asset name',
      align: 'left',
      csvOnly: false,
      formatter: noop,
    },
    {
      header: 'Epoch',
      align: 'right',
      csvOnly: false,
      formatter: noop,
    },
    {
      header: 'Date',
      align: 'left',
      csvOnly: false,
      formatter: formatDate,
    },
    {
      header: 'Transaction type',
      align: 'right',
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
      align: 'right',
      csvOnly: true,
      formatter: noop,
    },
    {
      header: 'Transaction',
      align: 'right',
      csvOnly: false,
      formatter: (v: any) => (
        <IconAnchor
          href={explorer.tx(v)}
          target="_blank"
          rel="noopener noreferrer"
          title="View account on block explorer"
        >
          <IconExternalLink />
        </IconAnchor>
      ),
    },
  ]

  const data: TableDataRow[] = React.useMemo(() => {
    if (!transactions) {
      return []
    }

    return transactions
      ?.map((tx) => ({
        name: '',
        value: [
          tx.asset.id.split('-').at(-1)!,
          tx.asset.name || `Asset ${tx.asset.id.split('-').at(-1)!}`,
          tx.epochId.split('-').at(-1)!,
          tx.timestamp.toISOString(),
          formatAssetTransactionType(tx.type),
          tx.amount?.toFloat() ?? '',
          pool.currency.symbol,
          tx.hash,
        ],
        heading: false,
      }))
      .filter((row) => {
        if (!loanId || loanId === 'all') return true
        return loanId === row.value[0]
      })
      .filter((row) => (!txType || txType === 'all' ? true : row.value[3] === txType))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, txType, loanId])

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
      fileName: `${pool.id}-asset-transactions-${formatDate(startDate, {
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
    <UserFeedback reportType="Asset transactions" />
  )
}
