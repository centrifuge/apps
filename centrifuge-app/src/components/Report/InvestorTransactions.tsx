import { isSameAddress } from '@centrifuge/centrifuge-js'
import { Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { NetworkIcon, useCentrifugeUtils, useGetExplorerUrl } from '@centrifuge/centrifuge-react'
import { Box, IconAnchor, IconExternalLink, Text } from '@centrifuge/fabric'
import { isAddress } from '@polkadot/util-crypto'
import * as React from 'react'
import { evmChains } from '../../config'
import { formatDate } from '../../utils/date'
import { formatBalance } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { DataTable, SortableTableHeader } from '../DataTable'
import { Spinner } from '../Spinner'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'
import type { TableDataRow } from './index'
import { useReport } from './useReportsQuery'
import { convertCSV, copyable, formatInvestorTransactionsType } from './utils'

const noop = (v: any) => v

export function InvestorTransactions({ pool }: { pool: Pool }) {
  const { activeTranche, setCsvData, startDate, endDate, txType, address, network } = React.useContext(ReportContext)
  const utils = useCentrifugeUtils()
  const explorer = useGetExplorerUrl('centrifuge')

  const { data: transactions = [], isLoading } = useReport(
    'investorTransactions',
    pool,
    new Date(startDate),
    new Date(endDate),
    undefined,
    {
      ...(address && { address }),
      ...(activeTranche !== 'all' && { tokenId: activeTranche }),
      ...(network !== 'all' && network && { network }),
      ...(txType !== 'all' && { transactionType: txType }),
    }
  )

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
      align: 'center',
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
      align: 'left',
      sortable: true,
      csvOnly: false,
      formatter: (v: any) => (typeof v === 'number' ? formatBalance(v, pool.currency.symbol, 2) : '-'),
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
      align: 'left',
      sortable: true,
      csvOnly: false,
      formatter: (v: any, row: any) => (typeof v === 'number' ? formatBalance(v, row[9], 2) : '-'),
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
      align: 'left',
      sortable: true,
      csvOnly: false,
      formatter: (v: any) => (typeof v === 'number' ? formatBalance(v, pool.currency.symbol, 6) : '-'),
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
      align: 'center',
      sortable: false,
      csvOnly: false,
      width: '100px',
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

  const columns = columnConfig

    .map((col, index) => ({
      align: col.align,
      header: col.sortable ? <SortableTableHeader label={col.header} /> : col.header,
      cell: (row: TableDataRow) => <Text variant="body3">{col.formatter((row.value as any)[index], row.value)}</Text>,
      width: col.width ?? '200px',
      sortKey: col.sortable ? `value[${index}]` : undefined,
      csvOnly: col.csvOnly,
    }))
    .filter((col) => !col.csvOnly)

  const data: TableDataRow[] = React.useMemo(() => {
    if (!transactions) {
      return []
    }

    return transactions
      ?.map((tx) => {
        const token = pool.tranches.find((t) => t.id === tx.trancheTokenId)!
        return {
          name: '',
          value: [
            token.currency.name,
            <Box display={'flex'}>
              <NetworkIcon size="iconSmall" network={tx.chainId || 'centrifuge'} />
              <Text style={{ marginLeft: 4 }}> {(evmChains as any)[tx.chainId]?.name || 'Centrifuge'}</Text>
            </Box>,
            utils.formatAddress(tx.account),
            tx.epoch || '-',
            tx.timestamp,
            formatInvestorTransactionsType({
              type: tx.transactionType,
              trancheTokenSymbol: token.currency.symbol,
              poolCurrencySymbol: pool.currency.symbol,
              currencyAmount: tx.currencyAmount ? tx.currencyAmount?.toDecimal().toNumber() : null,
            }),
            tx.currencyAmount?.toFloat() ?? '-',
            pool.currency.symbol,
            tx.trancheTokenAmount?.toFloat() ?? '-',
            token.currency.symbol,
            tx.price?.toFloat() ?? '-',
            pool.currency.symbol,
            tx.transactionHash,
          ],
          heading: false,
        }
      })
      .filter((row) => {
        if (!address) return true
        const addressValue = row.value[2] as string
        return isAddress(address) && isSameAddress(address, addressValue)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, pool.currency, pool.tranches, txType, address, network])

  React.useEffect(() => {
    if (!data.length) {
      return
    }

    const formatted = data.map(({ value: values }) => convertCSV(values, columnConfig))

    const dataUrl = getCSVDownloadUrl(formatted)

    if (!dataUrl) {
      throw new Error('Failed to create CSV')
    }

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

  if (isLoading) {
    return <Spinner mt={2} />
  }

  return data.length > 0 ? (
    <Box paddingX={2}>
      <DataTable data={data} columns={columns} hoverable scrollable />
    </Box>
  ) : (
    <UserFeedback reportType="Investor transactions" />
  )
}
