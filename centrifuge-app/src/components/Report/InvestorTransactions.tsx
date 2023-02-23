import { Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Text } from '@centrifuge/fabric'
import * as React from 'react'
import { formatDate } from '../../utils/date'
import { formatBalance } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { useInvestorTransactions } from '../../utils/usePools'
import { DataTable } from '../DataTable'
import type { TableDataRow } from './index'
import { ReportContext } from './ReportContext'

export function InvestorTransactions({ pool }: { pool: Pool }) {
  const { activeTranche, setCsvData } = React.useContext(ReportContext)

  const transactions = useInvestorTransactions(pool.id, activeTranche === 'all' ? undefined : activeTranche)

  const headers = [
    'Token',
    'Account',
    'Epoch',
    'Date',
    'Type',
    `${pool ? `${pool.currency.symbol} amount` : '—'}`,
    'Token amount',
    'Price',
  ]

  const columns = headers.map((col, index) => ({
    align: 'left',
    header: col,
    cell: (row: TableDataRow) => <Text variant="body2">{(row.value as any)[index]}</Text>,
    flex: index === 0 ? '0 0 150px' : index === 4 ? '0 0 200px' : '1',
  }))

  const data: TableDataRow[] = React.useMemo(() => {
    if (!transactions) {
      return []
    }

    return transactions?.map((tx) => {
      const tokenId = tx.trancheId.split('-')[1]
      const token = pool.tranches.find((t) => t.id === tokenId)!

      return {
        name: '',
        value: [
          token.currency.name,
          tx.accountId,
          tx.epochNumber,
          formatDate(tx.timestamp.toString()),
          tx.type,
          formatBalance(tx.currencyAmount.toDecimal()),
          formatBalance(tx.tokenAmount.toDecimal()),
          tx.tokenPrice ? formatBalance(tx.tokenPrice.toDecimal(), pool.currency.symbol, 4) : '',
        ],
        heading: false,
      }
    })
  }, [transactions])

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
            fileName: `Pool-${pool.id}.csv`,
          }
        : undefined
    )

    return () => setCsvData(undefined)
  }, [dataUrl])

  return <DataTable data={data} columns={columns} hoverable />
}
