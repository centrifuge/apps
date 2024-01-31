import { Pool } from '@centrifuge/centrifuge-js/dist/modules/pools'
import { useCentrifugeUtils } from '@centrifuge/centrifuge-react'
import { Text } from '@centrifuge/fabric'
import * as React from 'react'
import { evmChains } from '../../config'
import { formatDate } from '../../utils/date'
import { formatBalance } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { useInvestorTransactions } from '../../utils/usePools'
import { DataTable } from '../DataTable'
import { Spinner } from '../Spinner'
import type { TableDataRow } from './index'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'
import { copyable, formatInvestorTransactionsType } from './utils'

const noop = (v: any) => v
const cellFormatters = [noop, noop, copyable, noop, noop, noop, noop, noop, noop]

export function InvestorTransactions({ pool }: { pool: Pool }) {
  const { activeTranche, setCsvData, startDate, endDate, investorTxType } = React.useContext(ReportContext)
  const utils = useCentrifugeUtils()

  const transactions = useInvestorTransactions(
    pool.id,
    activeTranche === 'all' ? undefined : activeTranche,
    startDate,
    endDate
  )

  const headers = [
    'Token',
    'Network',
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
    cell: (row: TableDataRow) => <Text variant="body2">{cellFormatters[index]((row.value as any)[index])}</Text>,
  }))

  const data: TableDataRow[] = React.useMemo(() => {
    if (!transactions) {
      return []
    }

    return transactions
      ?.filter((tx) => {
        if (investorTxType == 'all') {
          return true
        }

        if (
          investorTxType == 'orders' &&
          (tx.type == 'INVEST_ORDER_UPDATE' ||
            tx.type == 'REDEEM_ORDER_UPDATE' ||
            tx.type == 'INVEST_ORDER_CANCEL' ||
            tx.type == 'REDEEM_ORDER_CANCEL')
        ) {
          return true
        }

        if (investorTxType == 'executions' && (tx.type == 'INVEST_EXECUTION' || tx.type == 'REDEEM_EXECUTION')) {
          return true
        }

        if (
          investorTxType == 'transfers' &&
          (tx.type == 'INVEST_COLLECT' ||
            tx.type == 'REDEEM_COLLECT' ||
            tx.type == 'INVEST_LP_COLLECT' ||
            tx.type == 'REDEEM_LP_COLLECT' ||
            tx.type == 'TRANSFER_IN' ||
            tx.type == 'TRANSFER_OUT')
        ) {
          return true
        }

        return false
      })
      .map((tx) => {
        const tokenId = tx.trancheId.split('-')[1]
        const token = pool.tranches.find((t) => t.id === tokenId)!

        return {
          name: '',
          value: [
            token.currency.name,
            (evmChains as any)[tx.chainId]?.name || 'Centrifuge',
            tx.evmAddress || utils.formatAddress(tx.accountId),
            tx.epochNumber ? tx.epochNumber.toString() : '-',
            formatDate(tx.timestamp.toString()),
            formatInvestorTransactionsType({
              type: tx.type,
              trancheTokenSymbol: token.currency.symbol,
              poolCurrencySymbol: pool.currency.symbol,
              currencyAmount: tx.currencyAmount ? tx.currencyAmount?.toNumber() : null,
            }),
            tx.currencyAmount ? formatBalance(tx.currencyAmount.toDecimal(), pool.currency) : '-',
            tx.tokenAmount ? formatBalance(tx.tokenAmount.toDecimal(), pool.tranches[0].currency) : '-', // TODO: not hardcode to 0
            tx.tokenPrice ? formatBalance(tx.tokenPrice.toDecimal(), pool.currency.symbol, 6) : '-',
          ],
          heading: false,
        }
      })
  }, [transactions, pool.currency, pool.tranches, investorTxType])

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
    <DataTable data={data} columns={columns} hoverable />
  ) : (
    <UserFeedback reportType="Investor transactions" />
  )
}
