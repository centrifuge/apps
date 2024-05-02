import { isSameAddress } from '@centrifuge/centrifuge-js'
import { Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { useCentrifugeUtils, useGetExplorerUrl } from '@centrifuge/centrifuge-react'
import { IconAnchor, IconExternalLink, Text } from '@centrifuge/fabric'
import { isAddress } from '@polkadot/util-crypto'
import * as React from 'react'
import { evmChains } from '../../config'
import { formatDate } from '../../utils/date'
import { formatBalance } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { useInvestorTransactions } from '../../utils/usePools'
import { DataTable, SortableTableHeader } from '../DataTable'
import { Spinner } from '../Spinner'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'
import type { TableDataRow } from './index'
import { copyable, formatInvestorTransactionsType } from './utils'

const noop = (v: any) => v
const headers = [
  'Token',
  'Network',
  'Account',
  'Epoch',
  'Date',
  'Transaction type',
  'Currency amount',
  'Currency',
  'Token amount',
  'Token currency',
  'Price',
  'Price currency',
  'Transaction',
]
const align = [
  'left',
  'left',
  'left',
  'left',
  'left',
  'left',
  'right',
  'left',
  'right',
  'left',
  'right',
  'left',
  'left',
]
const sortable = [false, false, false, false, true, false, true, false, true, false, true, false, false]
const csvOnly = [false, false, false, false, false, false, false, true, false, true, false, true, false]

export function InvestorTransactions({ pool }: { pool: Pool }) {
  const { activeTranche, setCsvData, startDate, endDate, txType, address, network } = React.useContext(ReportContext)
  const utils = useCentrifugeUtils()
  const explorer = useGetExplorerUrl('centrifuge')

  const cellFormatters = [
    noop,
    noop,
    copyable,
    noop,
    (v: any) => formatDate(v),
    noop,
    (v: any) => (typeof v === 'number' ? formatBalance(v, pool.currency.symbol, 5) : '-'),
    noop,
    (v: any, row: any) => (typeof v === 'number' ? formatBalance(v, row[9], 5) : '-'),
    noop,
    (v: any) => (typeof v === 'number' ? formatBalance(v, pool.currency.symbol, 5) : '-'),
    noop,
    (v: any) => (
      <IconAnchor
        href={explorer.tx(v)}
        target="_blank"
        rel="noopener noreferrer"
        title="View account on block explorer"
      >
        <IconExternalLink />
      </IconAnchor>
    ),
  ]

  const transactions = useInvestorTransactions(
    pool.id,
    activeTranche === 'all' ? undefined : activeTranche,
    startDate ? new Date(startDate) : undefined,
    endDate ? new Date(endDate) : undefined
  )

  const columns = headers
    .map((col, index) => ({
      align: align[index],
      header: sortable[index] ? <SortableTableHeader label={col} /> : col,
      cell: (row: TableDataRow) => (
        <Text variant="body3">{cellFormatters[index]((row.value as any)[index], row.value)}</Text>
      ),
      sortKey: sortable[index] ? `value[${index}]` : undefined,
    }))
    .filter((_, index) => !csvOnly[index])
  console.log('transactions', transactions)
  const data: TableDataRow[] = React.useMemo(() => {
    if (!transactions) {
      return []
    }

    return transactions
      ?.filter((tx) => {
        if (txType === 'all') {
          return true
        }

        if (
          txType === 'orders' &&
          (tx.type === 'INVEST_ORDER_UPDATE' ||
            tx.type === 'REDEEM_ORDER_UPDATE' ||
            tx.type === 'INVEST_ORDER_CANCEL' ||
            tx.type === 'REDEEM_ORDER_CANCEL')
        ) {
          return true
        }

        if (txType === 'executions' && (tx.type === 'INVEST_EXECUTION' || tx.type === 'REDEEM_EXECUTION')) {
          return true
        }

        if (
          txType === 'transfers' &&
          (tx.type === 'INVEST_COLLECT' ||
            tx.type === 'REDEEM_COLLECT' ||
            tx.type === 'INVEST_LP_COLLECT' ||
            tx.type === 'REDEEM_LP_COLLECT' ||
            tx.type === 'TRANSFER_IN' ||
            tx.type === 'TRANSFER_OUT')
        ) {
          return true
        }

        return false
      })
      .filter((tx) => {
        if (!network || network === 'all') return true
        return network === (tx.chainId || 'centrifuge')
      })
      .map((tx) => {
        const token = pool.tranches.find((t) => t.id === tx.trancheId)!
        return {
          name: '',
          value: [
            token.currency.name,
            (evmChains as any)[tx.chainId]?.name || 'Centrifuge',
            utils.formatAddress(tx.evmAddress || tx.accountId),
            tx.epochNumber ? tx.epochNumber.toString() : '-',
            tx.timestamp.toISOString(),
            formatInvestorTransactionsType({
              type: tx.type,
              trancheTokenSymbol: token.currency.symbol,
              poolCurrencySymbol: pool.currency.symbol,
              currencyAmount: tx.currencyAmount ? tx.currencyAmount?.toNumber() : null,
            }),
            tx.currencyAmount?.toFloat() ?? '-',
            pool.currency.symbol,
            tx.tokenAmount?.toFloat() ?? '-',
            token.currency.symbol,
            tx.tokenPrice?.toFloat() ?? '-',
            pool.currency.symbol,
            tx.hash,
          ],
          heading: false,
        }
      })
      .filter((row) => {
        if (!address) return true
        return isAddress(address) && isSameAddress(address, row.value[2])
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, pool.currency, pool.tranches, txType, address, network])

  React.useEffect(() => {
    if (!data.length) {
      return
    }

    const formatted = data.map(({ value: values }) =>
      Object.fromEntries(headers.map((_, index) => [headers[index], `"${values[index]}"`]))
    )
    const dataUrl = getCSVDownloadUrl(formatted)

    setCsvData({
      dataUrl,
      fileName: `${pool.id}-investor-transactions-${formatDate(startDate, {
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
    <UserFeedback reportType="Investor transactions" />
  )
}
