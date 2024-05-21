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

export function InvestorTransactions({ pool }: { pool: Pool }) {
  const { activeTranche, setCsvData, startDate, endDate, txType, address, network } = React.useContext(ReportContext)
  const utils = useCentrifugeUtils()
  const explorer = useGetExplorerUrl('centrifuge')

  const columnConfig = [
    {
      header: 'Token',
      align: 'left',
      sortable: false,
      csvOnly: false,
      formatter: noop,
    },
    {
      header: 'Network',
      align: 'left',
      sortable: false,
      csvOnly: false,
      formatter: noop,
    },
    {
      header: 'Account',
      align: 'left',
      sortable: false,
      csvOnly: false,
      formatter: copyable,
    },
    {
      header: 'Epoch',
      align: 'left',
      sortable: false,
      csvOnly: false,
      formatter: noop,
    },
    {
      header: 'Date',
      align: 'left',
      sortable: true,
      csvOnly: false,
      formatter: (v: any) => formatDate(v),
    },
    {
      header: 'Transaction type',
      align: 'left',
      sortable: false,
      csvOnly: false,
      formatter: noop,
    },
    {
      header: 'Currency amount',
      align: 'right',
      sortable: true,
      csvOnly: false,
      formatter: (v: any) => (typeof v === 'number' ? formatBalance(v, pool.currency.symbol, 5) : '-'),
    },
    {
      header: 'Currency',
      align: 'left',
      sortable: false,
      csvOnly: true,
      formatter: noop,
    },
    {
      header: 'Token amount',
      align: 'right',
      sortable: true,
      csvOnly: false,
      formatter: (v: any, row: any) => (typeof v === 'number' ? formatBalance(v, row[9], 5) : '-'),
    },
    {
      header: 'Token currency',
      align: 'left',
      sortable: false,
      csvOnly: true,
      formatter: noop,
    },
    {
      header: 'Price',
      align: 'right',
      sortable: true,
      csvOnly: false,
      formatter: (v: any) => (typeof v === 'number' ? formatBalance(v, pool.currency.symbol, 5) : '-'),
    },
    {
      header: 'Price currency',
      align: 'left',
      sortable: false,
      csvOnly: true,
      formatter: noop,
    },
    {
      header: 'Transaction',
      align: 'left',
      sortable: false,
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

  const transactions = useInvestorTransactions(
    pool.id,
    activeTranche === 'all' ? undefined : activeTranche,
    startDate ? new Date(startDate) : undefined,
    endDate ? new Date(endDate) : undefined
  )

  const columns = columnConfig

    .map((col, index) => ({
      align: col.align,
      header: col.sortable ? <SortableTableHeader label={col.header} /> : col.header,
      cell: (row: TableDataRow) => <Text variant="body3">{col.formatter((row.value as any)[index], row.value)}</Text>,
      sortKey: col.sortable ? `value[${index}]` : undefined,
      csvOnly: col.csvOnly,
    }))
    .filter((col) => !col.csvOnly)

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
      Object.fromEntries(columnConfig.map((col, index) => [col.header, `"${values[index]}"`]))
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
