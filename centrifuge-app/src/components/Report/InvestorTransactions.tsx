import { Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { Text } from '@centrifuge/fabric'
import * as React from 'react'
import { formatDate } from '../../utils/date'
import { formatBalance } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { useInvestorTransactions } from '../../utils/usePools'
import { DataTable } from '../DataTable'
import { Spinner } from '../Spinner'
import type { TableDataRow } from './index'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'
import { formatInvestorTransactionsType } from './utils'

function truncate(string: string) {
  const first = string.slice(0, 5)
  const last = string.slice(-5)

  return `${first}...${last}`
}

export function InvestorTransactions({ pool }: { pool: Pool }) {
  const { activeTranche, setCsvData, startDate, endDate } = React.useContext(ReportContext)

  const transactions = useInvestorTransactions(
    pool.id,
    activeTranche === 'all' ? undefined : activeTranche,
    startDate,
    endDate
  )

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
  const columnWidths = ['220px', '150px', '100px', '120px', '300px', '180px', '180px', '180px']

  const columns = headers.map((col, index) => ({
    align: 'left',
    header: col,
    cell: (row: TableDataRow) => <Text variant="body2">{(row.value as any)[index]}</Text>,
    flex: `0 0 ${columnWidths[index]}`,
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
          truncate(tx.accountId),
          tx.epochNumber.toString(),
          formatDate(tx.timestamp.toString()),
          formatInvestorTransactionsType({
            type: tx.type,
            trancheTokenSymbol: token.currency.symbol,
            poolCurrencySymbol: pool.currency.symbol,
            currencyAmount: tx.currencyAmount ? tx.currencyAmount?.toNumber() : null,
          }),
          tx.currencyAmount ? formatBalance(tx.currencyAmount.toDecimal(), pool.currency) : '-',
          tx.tokenAmount ? formatBalance(tx.tokenAmount.toDecimal(), pool.currency) : '-',
          tx.tokenPrice ? formatBalance(tx.tokenPrice.toDecimal(), pool.currency.symbol, 4) : '-',
        ],
        heading: false,
      }
    })
  }, [transactions, pool.currency, pool.tranches])

  const dataUrl = React.useMemo(() => {
    if (!data.length) {
      return
    }

    const formatted = data
      .map(({ value }) => value as string[])
      .map((values) => Object.fromEntries(headers.map((_, index) => [headers[index], `"${values[index]}"`])))

    return getCSVDownloadUrl(formatted)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  React.useEffect(() => {
    setCsvData(
      dataUrl
        ? {
            dataUrl,
            fileName: `${pool.id}-investor-transactions-${startDate}-${endDate}.csv`,
          }
        : undefined
    )

    return () => setCsvData(undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataUrl, pool.id, startDate, endDate])

  if (!transactions) {
    return <Spinner mt={2} />
  }

  return data.length > 0 ? (
    <DataTable data={data} columns={columns} hoverable rounded={false} />
  ) : (
    <UserFeedback reportType="Investor transactions" />
  )
}
