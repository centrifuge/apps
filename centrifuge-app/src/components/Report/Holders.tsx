import { Pool, isSameAddress } from '@centrifuge/centrifuge-js'
import { useCentrifugeUtils } from '@centrifuge/centrifuge-react'
import { Text } from '@centrifuge/fabric'
import { isAddress } from '@polkadot/util-crypto'
import * as React from 'react'
import { evmChains } from '../../config'
import { formatBalance } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { useHolders } from '../../utils/usePools'
import { DataTable } from '../DataTable'
import { Spinner } from '../Spinner'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'
import type { TableDataRow } from './index'
import { copyable } from './utils'

const noop = (v: any) => v
const headers = [
  'Network',
  'Account',
  'Position',
  'Position currency',
  'Pending invest order',
  'Pending invest order currency',
  'Pending redeem order',
  'Pending redeem order currency',
]
const align = ['left', 'left', 'right', 'left', 'right', 'left', 'right', 'left']
const csvOnly = [false, false, false, true, false, true, false, true, false]

export function Holders({ pool }: { pool: Pool }) {
  const { activeTranche, setCsvData, network, address } = React.useContext(ReportContext)

  const utils = useCentrifugeUtils()
  const holders = useHolders(pool.id, activeTranche === 'all' ? undefined : activeTranche)

  const cellFormatters = [
    noop,
    copyable,
    (v: any, row: any) => (typeof v === 'number' ? formatBalance(v, row[3], 5) : '-'),
    noop,
    (v: any) => (typeof v === 'number' ? formatBalance(v, pool.currency.symbol, 5) : '-'),
    noop,
    (v: any, row: any) => (typeof v === 'number' ? formatBalance(v, row[3], 5) : '-'),
    noop,
  ]

  const columns = headers
    .map((col, index) => ({
      align: align[index],
      header: col,
      cell: (row: TableDataRow) => (
        <Text variant="body3">{cellFormatters[index]((row.value as any)[index], row.value)}</Text>
      ),
    }))
    .filter((_, index) => !csvOnly[index])

  const data: TableDataRow[] = React.useMemo(() => {
    if (!holders) {
      return []
    }
    return holders
      .filter((holder) => !holder.balance.isZero() || !holder.claimableTrancheTokens.isZero())
      .filter((tx) => {
        if (!network || network === 'all') return true
        return network === (tx.chainId || 'centrifuge')
      })
      .map((holder) => {
        const token = pool.tranches.find((t) => t.id === holder.trancheId)!
        return {
          name: '',
          value: [
            (evmChains as any)[holder.chainId]?.name || 'Centrifuge',
            holder.evmAddress || utils.formatAddress(holder.accountId),
            holder.balance.toFloat() + holder.claimableTrancheTokens.toFloat(),
            token.currency.symbol,
            holder.pendingInvestCurrency.toFloat(),
            pool.currency.symbol,
            holder.pendingRedeemTrancheTokens.toFloat(),
            token.currency.symbol,
          ],
          heading: false,
        }
      })
      .filter((row) => {
        if (!address) return true
        return isAddress(address) && isSameAddress(address, row.value[1])
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holders, network, pool, address])

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
            fileName: `${pool.id}-holders.csv`,
          }
        : undefined
    )

    return () => setCsvData(undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataUrl, pool.id])

  if (!holders) {
    return <Spinner />
  }

  return data.length > 0 ? <DataTable data={data} columns={columns} hoverable /> : <UserFeedback reportType="Holders" />
}
